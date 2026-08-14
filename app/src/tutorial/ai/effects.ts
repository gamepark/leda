import { Clan } from '@gamepark/leda/Clan'
import { ClanCardId, ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { clanCardEffects } from '@gamepark/leda/material/clanCards/cardProperties'
import { isRing } from '@gamepark/leda/material/clanCards/catCards'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { militaryVictoryEffects, MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { cellOf, tileAt } from '@gamepark/leda/material/PlayerGrid'
import { isPermanent, tileEffects } from '@gamepark/leda/material/TileEffect'
import { TileId } from '@gamepark/leda/material/TileId'
import { squareEffects } from '@gamepark/leda/rules/activation'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { cardDiscount, pendingChoices } from '@gamepark/leda/rules/effects'
import { victorySymbols } from '@gamepark/leda/rules/militaryConflict'
import { topCardIndexOn, topCardOn } from '@gamepark/leda/rules/squares'
import { upgradedTiles } from '@gamepark/leda/rules/tileChoices'
import { victorySymbolsToWin } from '@gamepark/leda/rules/victory'
import { isCustomMoveType, isMoveItemType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { Ai, bestOf, effectsGain, futureValue, gainValue, Scored } from './AiPlayer'
import { bestPlacement, playCardValue, spendingPenalty, swapValue, victoryValue } from './cards'
import {
  cellOfTile,
  cellOutlook,
  isPendingCell,
  squareFutureValue,
  squareGain,
  squareValue,
  tileFrontFutureValue,
  tileFutureValue,
  tileValue,
  tokenGain,
  upgradeGain
} from './grid'
import { tokenValue } from './spy'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The rules an effect opens to ask the player something, whichever tile, card or Military Victory token gave it
 * (see {@link EffectRule}). One function per question, each of them scoring the moves the rules handed over and
 * keeping the best: the AI never builds a move of its own, so it can never offer one that is not legal.
 */

/** The square a custom move names, for the 5 rules that have the player designate one. */
const namedCell = (move: Move): XYCoordinates | undefined =>
  isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move) ? move.data : undefined

const scoreCells = (moves: Move[], value: (cell: XYCoordinates) => number): Scored<Move>[] =>
  moves.flatMap((move) => {
    const cell = namedCell(move)
    return cell === undefined ? [] : [{ move, score: value(cell) }]
  })

const isPass = (move: Move): boolean => isCustomMoveType(CustomMoveType.Pass)(move)

/**
 * An Upgrade: which of the permanent tiles to turn onto its stronger face.
 *
 * "Improve a tile before activating it" is the whole of this: a tile of the zone its owner has not resolved yet is
 * going to be activated this very round, on the face it is showing by then, so upgrading that one is worth the
 * upgrade twice over. {@link cellOutlook} already says so, the certain activation being part of what it counts,
 * so nothing here has to know about zones at all.
 *
 * Shared with the Scorpion card that upgrades a tile and then activates it, where the tile picked is the tile
 * activated: what its upgraded face gives is added on top (see {@link UpgradeAndActivateTileRule}).
 */
export const upgradeTile = (ai: Ai, moves: Move[], thenActivate = false): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isMoveItemType(MaterialType.Tile)(move)) return []
      const cell = cellOfTile(ai.rules, move.itemIndex)
      const upgraded = upgradeGain(ai, move.itemIndex) * cellOutlook(ai, cell)
      // The Orange Ring of the Cats asks for 5 upgraded tiles, which is a third of the game for that clan.
      const ring = ai.clan === Clan.Cat && upgradedTiles(ai.rules, ai.player).length === 4 ? 4 : 0
      const activated = thenActivate ? upgradedTileValue(ai, move.itemIndex) : 0
      return [{ move, score: upgraded + ring + activated }]
    })
  )

/** What a tile gives once it has been turned onto its upgraded face, which is what an "upgrade then activate" gives. */
const upgradedTileValue = (ai: Ai, index: number): number => {
  const tile = ai.rules.material(MaterialType.Tile).getItem<TileId>(index)
  if (tile === undefined) return 0
  return gainValue(ai, effectsGain(ai, tileEffects(tile.id!, true), { item: { type: MaterialType.Tile, index } }))
}

/**
 * A Flip: which Desert to turn back onto its front, where it can be activated again.
 * The Scorpions read their grid in pairs of Deserts, so turning one back costs them half a pair of everything
 * their cards give (see {@link desertPairs}).
 */
export const flipDesert = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isMoveItemType(MaterialType.Tile)(move)) return []
      const cell = cellOfTile(ai.rules, move.itemIndex)
      const tile = ai.rules.material(MaterialType.Tile).getItem<TileId>(move.itemIndex)
      if (tile === undefined) return []
      const front = tileFrontFutureValue(ai, move.itemIndex)
      return [{ move, score: front * cellOutlook(ai, cell) - (ai.clan === Clan.Scorpion ? 0.8 : 0) }]
    })
  )

/**
 * An "OR": which branch of what an effect offers to resolve. The branches are read against what the choice was
 * reached from, exactly as the rules read them once one is picked (see {@link ChooseEffectRule}).
 *
 * This is where the Pandas take their Awakening over the Food their crystal also offers, and where every card
 * reading "1 Food OR 1 military symbol" is settled against the conflict of the round rather than by a habit.
 */
export const chooseEffect = (ai: Ai, moves: Move[]): Move | undefined => {
  const choice = pendingChoices(ai.rules)[0]
  if (choice === undefined) return moves[0]
  return bestOf(
    moves.flatMap((move) => {
      if (!isCustomMoveType<CustomMoveType, number>(CustomMoveType.ChooseEffect)(move) || move.data === undefined) return []
      const branch = choice.or[move.data]
      if (branch === undefined) return []
      return [{ move, score: gainValue(ai, effectsGain(ai, branch, { item: choice.item, from: choice.from })) }]
    })
  )
}

/**
 * "You may play a card from your hand, reducing its cost": the same decision the organisation makes, at a
 * discount, and with the chance to be turned down.
 */
export const playCardEffect = (ai: Ai, moves: Move[]): Move | undefined => {
  const discount = cardDiscount(ai.rules)
  const played = moves.flatMap((move) => {
    if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.type !== LocationType.PlayedCard) return []
    const front = ai.rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex)?.id?.front
    if (front === undefined || move.location.parent === undefined) return []
    return [{ move, score: playCardValue(ai, move.itemIndex, move.location.parent, discount) - spendingPenalty(ai, front, discount) }]
  })
  const best = bestOf(played.filter((candidate) => candidate.score > 0))
  return best ?? moves.find(isPass) ?? bestOf(played)
}

/**
 * The price of one of the 3 Cat cards paid with cards: which card of the hand goes under the deck.
 * The worst one, which for a clan trying to empty its own deck is not quite the cheapest: what is put under is
 * drawn again before the deck runs out, so what is paid is the card the AI would have played last anyway.
 */
export const payCardCost = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isMoveItemType(MaterialType.ClanCard)(move)) return []
      return [{ move, score: -(bestPlacement(ai, move.itemIndex)?.value ?? 0) }]
    })
  )

/** "Activate one of your cards in play", which the Panda Queen is the one card of the box to give. */
export const activateCard = (ai: Ai, moves: Move[]): Move | undefined => bestOf(scoreCells(moves, (cell) => squareValue(ai, cell)))

/** "Activate the effect reminded on one of your Deserts": what its front gave, read off the back that reminds it. */
export const activateDesert = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    scoreCells(moves, (cell) => {
      const index = tileIndexAt(ai, cell)
      if (index === undefined) return 0
      const id = ai.rules.material(MaterialType.Tile).getItem<TileId>(index)?.id
      // The front of the tile, which is what its Desert side reminds (see {@link ActivateDesertRule}).
      return id === undefined ? 0 : gainValue(ai, effectsGain(ai, tileEffects(id, false), { item: { type: MaterialType.Tile, index } }))
    })
  )

/** The tile standing on a square of the AI's own grid. */
const tileIndexAt = (ai: Ai, cell: XYCoordinates): number | undefined =>
  tileAt(ai.rules.material(MaterialType.Tile), ai.player, cell).getIndexes()[0]

/**
 * "Activate one of your tiles": what the tile gives now, less what it stops giving afterwards. A temporary tile
 * becomes a Desert as it is activated, wherever it is activated from, so reaching for one is spending it; a
 * permanent tile gives the same thing again next round and costs nothing.
 *
 * Shared with the Shark card that upgrades the tile it just activated, which is what makes a permanent tile on
 * its front the one worth picking there (see {@link ActivateAndUpgradeTileRule}).
 */
export const activateTile = (ai: Ai, moves: Move[], thenUpgrade = false): Move | undefined =>
  bestOf(
    scoreCells(moves, (cell) => {
      const index = tileIndexAt(ai, cell)
      if (index === undefined) return 0
      const tile = ai.rules.material(MaterialType.Tile).getItem<TileId>(index)
      if (tile === undefined) return 0
      // A temporary tile becomes a Desert as it gives what it gives, wherever it was activated from. What that
      // costs is only the activation the zone of the round was still owed on that square: everywhere further
      // ahead, the zone would have spent that tile anyway.
      const spent = isPermanent(tile.id!) || !isPendingCell(ai, cell) ? 0 : tileValue(ai, index)
      const upgraded = thenUpgrade ? upgradeGain(ai, index) * cellOutlook(ai, cell) : 0
      return tileValue(ai, index) - spent + upgraded
    })
  )

/**
 * A Scorpion Portal read from the other side of the table: the AI is the one turning one of its own tiles onto its
 * worse face, so it picks the one it will miss least.
 * A temporary tile turned into a Desert is worth something to a Scorpion, who counts those in pairs, which is the
 * one case where being asked this is not entirely bad news.
 */
export const downgradeTile = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isMoveItemType(MaterialType.Tile)(move)) return []
      const index = move.itemIndex
      const tile = ai.rules.material(MaterialType.Tile).getItem<TileId>(index)
      if (tile === undefined) return []
      const cell = cellOfTile(ai.rules, index)
      const lost = isPermanent(tile.id!) ? upgradeGain(ai, index) : tileFutureValue(ai, index)
      const desert = !isPermanent(tile.id!) && ai.clan === Clan.Scorpion ? 0.8 : 0
      return [{ move, score: desert - lost * cellOutlook(ai, cell) }]
    })
  )

/** "Put one of your Military Victory tokens back under the pile": the one worth least, since a new one replaces it. */
export const redrawMilitaryVictory = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isMoveItemType(MaterialType.MilitaryVictoryToken)(move)) return []
      const token = ai.rules.material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(move.itemIndex)
      return token?.id === undefined ? [] : [{ move, score: -tokenValue(ai, token.id) }]
    })
  )

/** "Trigger the effect of one of your Military Victory tokens": the symbols are already owned, so only the effect counts. */
export const triggerMilitaryVictory = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isCustomMoveType<CustomMoveType, number>(CustomMoveType.TriggerMilitaryVictory)(move) || move.data === undefined) return []
      const token = ai.rules.material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(move.data)
      if (token?.id === undefined) return []
      return [{ move, score: gainValue(ai, effectsGain(ai, militaryVictoryEffects[token.id] ?? {})) }]
    })
  )

/**
 * "Place a Shark token on one of your tiles that has none": the Pack, spread without playing a card, which is the
 * cheapest way the Sharks ever have of waking one up (see {@link tokenGain}).
 */
export const placeSharkToken = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isMoveItemType(MaterialType.SharkToken)(move) || move.location.parent === undefined) return []
      return [{ move, score: tokenGain(ai, cellOfTile(ai.rules, move.location.parent)) }]
    })
  )

/**
 * "Copy the effect of a square your opponent can activate this turn": their square is read on their grid, and what
 * it gives is given here, so it is priced with the eyes of the AI and not with theirs.
 */
export const copyOpponentCard = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    scoreCells(moves, (cell) => {
      const effects = squareEffects(ai.rules, ai.opponent, cell)
      return effects === undefined ? 0 : gainValue(ai, effectsGain(ai, effects))
    })
  )

/**
 * "Search a Ring in your deck": which of the 4, ranked on how close its own condition is to being met, since a
 * Ring in hand is worth nothing until it can be put in play (see {@link ringPlacements}).
 */
export const searchRing = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isCustomMoveType<CustomMoveType, ClanCardId>(CustomMoveType.SearchRing)(move) || move.data === undefined) return []
      return [{ move, score: ringReadiness(ai, move.data) }]
    })
  )

/** How near each Ring is to the condition it asks for, on a scale of its own: only the order of these matters. */
const ringReadiness = (ai: Ai, ring: ClanCardId): number => {
  const deck = ai.rules.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(ai.player).length
  switch (ring) {
    // Blue: an empty deck, which a Cat drawing every round walks into on its own.
    case ClanCardId.CatRingEmptyDeck:
      return 8 - deck
    // Orange: 5 upgraded tiles, out of the 8 permanent ones of a grid.
    case ClanCardId.CatRingFiveUpgradedTiles:
      return upgradedTiles(ai.rules, ai.player).length
    // Purple: 3 Cat cards in the zone of a round, which takes a grid the Cats have really filled.
    case ClanCardId.CatRingThreeCatCards:
      return catCardsInPlay(ai)
    // Red: a conflict won by 3 symbols or more, which no amount of building makes any closer.
    default:
      return 2
  }
}

/** How full of Cat cards the grid is, which is what makes 3 of them in one zone a plausible thing to wait for. */
const catCardsInPlay = (ai: Ai): number => ai.rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(ai.player).length * 0.5

/**
 * "You may put a Ring under your deck to draw a Military Victory token": turned down as a rule, a Ring being a
 * third of what the Cats win on. Taken when the token would win the game outright, and when the AI holds more
 * Rings than the 3 it needs.
 */
export const spendRingForToken = (ai: Ai, moves: Move[]): Move | undefined => {
  const pass = moves.find(isPass)
  const goal = ai.clan === undefined ? Infinity : victorySymbolsToWin[ai.clan]
  const wins = victorySymbols(ai.rules, ai.player) + 1 >= goal
  const spare = ringsHeldOrPlayed(ai) > 3
  if (!wins && !spare) return pass ?? moves[0]
  return moves.find((move) => !isPass(move)) ?? pass
}

/** The Rings the AI holds or has already played, which is what it has to reach 3 with. */
const ringsHeldOrPlayed = (ai: Ai): number =>
  ai.rules
    .material(MaterialType.ClanCard)
    .player(ai.player)
    .location((location) => location.type === LocationType.PlayerHand || location.type === LocationType.PlayedCard)
    .getItems<ClanCardItemId>()
    .filter((card) => card.id?.front !== undefined && isRing(card.id.front)).length

/**
 * "You may Rotate one of your Cat cards": the half turn taken by hand rather than by activating, which is what a
 * Ring buys. Worth taking only when the face it lands on is worth more than the one it leaves, and half the Cat
 * cards of the box have nothing at all on their second face.
 */
export const rotateCatCard = (ai: Ai, moves: Move[]): Move | undefined => {
  const rotations = moves.flatMap((move) => {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.RotateCatCard)(move) || move.data === undefined) return []
    return [{ move, score: turnValue(ai, move.data) }]
  })
  const best = bestOf(rotations.filter((candidate) => candidate.score > 0))
  return best ?? moves.find(isPass) ?? bestOf(rotations)
}

/** What turning the card of a square onto its other face would be worth, over the rounds that square has left. */
const turnValue = (ai: Ai, cell: XYCoordinates): number => {
  const front = topCardOn(ai.rules, ai.player, cell)
  if (front === undefined) return 0
  const here = futureValue(ai, squareGain(ai, cell))
  const there = futureValue(ai, effectsGain(ai, clanCardEffects(front, !isRotated(ai, cell))))
  return (there - here) * cellOutlook(ai, cell)
}

/** Which of its 2 effects the card of a square is showing, read off the rotation of that card as the rules do. */
const isRotated = (ai: Ai, cell: XYCoordinates): boolean => {
  const index = topCardIndexOn(ai.rules, ai.player, cell)
  return index !== undefined && ai.rules.material(MaterialType.ClanCard).getItem(index).location.rotation === true
}

/** "Swap the position of 2 of your cards or tiles", which a Scorpion Portal gives for free (see {@link swapValue}). */
export const swapSquares = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isMoveItemType(MaterialType.Tile)(move)) return []
      const from = cellOfTile(ai.rules, move.itemIndex)
      const to = cellOf(move.location)
      return [{ move, score: swapValue(ai, from, to) }]
    })
  )

/**
 * An Awakening: which Panda of the hand takes the square of one of the level below. The Panda it replaces goes
 * back to its owner's hand rather than under the one being played, so nothing is buried here and only what the
 * grid gains counts, the 2 Gold Pandas that win the game first of all.
 */
export const awaken = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.parent === undefined) return []
      const front = ai.rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex)?.id?.front
      if (front === undefined) return []
      const cell = cellOfTile(ai.rules, move.location.parent)
      const raised = futureValue(ai, effectsGain(ai, clanCardEffects(front)))
      const replaced = squareFutureValue(ai, cell)
      return [{ move, score: (raised - replaced) * cellOutlook(ai, cell) + victoryValue(ai, front, cell) }]
    })
  )

/**
 * A Ring put in play for free, which is a third of the game for the Cats: always taken, and laid on the square it
 * costs least (see {@link playCardValue}). The pass the rule offers is only ever used when nothing else is legal.
 */
export const placeRing = (ai: Ai, moves: Move[]): Move | undefined => {
  const placements = moves.flatMap((move) => {
    if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.parent === undefined) return []
    return [{ move, score: playCardValue(ai, move.itemIndex, move.location.parent) }]
  })
  return bestOf(placements) ?? moves.find(isPass) ?? moves[0]
}

export { isPass }
