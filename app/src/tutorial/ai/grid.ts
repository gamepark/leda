import { Clan } from '@gamepark/leda/Clan'
import { ActionZone } from '@gamepark/leda/material/ActionZone'
import { ClanCardId, clanOf } from '@gamepark/leda/material/ClanCardId'
import { clanCardEffects } from '@gamepark/leda/material/clanCards/cardProperties'
import { Effect, effectEntries, EffectSet, EffectSource, isEffectChoice } from '@gamepark/leda/material/Effect'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, gridCells, sameCell, tileAt } from '@gamepark/leda/material/PlayerGrid'
import { isPermanent, tileEffects } from '@gamepark/leda/material/TileEffect'
import { TileId } from '@gamepark/leda/material/TileId'
import { activableCells, squareEffects } from '@gamepark/leda/rules/activation'
import { effectQuantity } from '@gamepark/leda/rules/effects'
import { militarySymbols } from '@gamepark/leda/rules/militaryConflict'
import { sharkTokenCells } from '@gamepark/leda/rules/sharkPack'
import { playerClan, specialActivationEffects } from '@gamepark/leda/rules/specialActivation'
import { topCardIndexOn, topCardOn } from '@gamepark/leda/rules/squares'
import { areAdjacentSquares, XYCoordinates } from '@gamepark/rules-api'
import { cellLikelihood, zoneCells } from './actionTiles'
import { Ai, aiPlayer, effectsGain, futureValue, Gain, gainValue, noGain, sumGains, withMilitaryNeed } from './AiPlayer'
import { Rules } from '@gamepark/leda/Rules'

/**
 * The grid, read the way the AI decides on it: what each square is worth, how likely it is to be activated, and
 * what the zone of the round is worth on the 2 grids at once.
 *
 * Everything here is public knowledge: the grids lie face up, and so do the Victory condition cards that say what
 * each player is playing for. The AI never reads a hand it does not own, nor the order of a face down pile: what
 * it knows of a pile is what a Spy effect showed it (see {@link spy}).
 */

/**
 * What is giving the effects of a square, which the quantities some cards are written as are read against: the
 * card played on the square, or the tile of the square when no card covers it (see {@link EffectQuantity}).
 */
export const squareSource = (rules: Rules, player: number, cell: XYCoordinates): EffectSource => {
  const card = topCardIndexOn(rules, player, cell)
  if (card !== undefined) return { item: { type: MaterialType.ClanCard, index: card } }
  const [tile] = tileAt(rules.material(MaterialType.Tile), player, cell).getIndexes()
  return tile === undefined ? {} : { item: { type: MaterialType.Tile, index: tile } }
}

/** What activating a square of a player's own grid would give them, gathered in the currency of the AI. */
export const squareGain = (ai: Ai, cell: XYCoordinates, player = ai.player): Gain => {
  const effects = squareEffects(ai.rules, player, cell)
  return effects === undefined ? noGain : effectsGain(ai, effects, squareSource(ai.rules, player, cell))
}

/** What activating it right now is worth, the conflict of this round included (see {@link gainValue}). */
export const squareValue = (ai: Ai, cell: XYCoordinates, player = ai.player): number => gainValue(ai, squareGain(ai, cell, player))

/** What it will be worth every time it comes up from now on, which is what a grid is built on (see {@link futureValue}). */
export const squareFutureValue = (ai: Ai, cell: XYCoordinates, player = ai.player): number => futureValue(ai, squareGain(ai, cell, player))

/**
 * How many rounds of the game are still ahead, as far as anything played on a grid is concerned.
 *
 * A card played, a tile upgraded or 2 squares swapped are not worth one activation, they are worth every
 * activation left in the game, which is what makes them worth paying for at all. Nothing in LEDA says how many
 * that is, the game ending on a race rather than on a count of rounds, so this is a plain guess at the middle of
 * one: high enough that the AI builds its grid, low enough that it does not pay 7 Food for a card it will see
 * twice.
 */
const roundsAhead = 8

/**
 * How often a square is still going to be activated: what the Action tiles left in the pile make of it, over the
 * rounds ahead, plus the one activation it is certain of when it belongs to the zone of this round and its owner
 * has not resolved it yet.
 *
 * That certain activation is what makes the AI upgrade a tile it is about to activate rather than one it may reach
 * in 3 rounds (see {@link upgradeTile}), and it is the whole of "improve a tile before activating it".
 */
export const cellOutlook = (ai: Ai, cell: XYCoordinates): number => cellLikelihood(ai.coming, cell) * roundsAhead + (isPendingCell(ai, cell) ? 1 : 0)

/** Whether a square belongs to the zone of the round and its owner has not resolved it yet. */
export const isPendingCell = (ai: Ai, cell: XYCoordinates): boolean => ai.pending.some((activable) => sameCell(activable, cell))

/** What a square is worth to its owner for the rest of the game: what it gives, as often as it will give it. */
export const weightedCellValue = (ai: Ai, cell: XYCoordinates): number => squareFutureValue(ai, cell) * cellOutlook(ai, cell)

/**
 * The military symbols a set of effects can yield at best, an "OR" counted as the branch that gives the most and a
 * special activation expanded into what the clan of that player makes of it.
 *
 * Read against a player who has not activated yet, whose grid the AI has every right to read: what it is guessing
 * at is the order they will pick, not what their squares hold.
 */
const maxMilitary = (rules: Rules, player: number, effects: EffectSet, source: EffectSource): number => {
  if (isEffectChoice(effects)) {
    return Math.max(0, ...effects.or.map((branch) => maxMilitary(rules, player, branch, source)))
  }
  return effectEntries(effects).reduce((symbols, [effect, written]) => {
    const quantity = effectQuantity(rules, player, written, source)
    if (quantity <= 0) return symbols
    if (effect === Effect.Military) return symbols + quantity
    if (effect !== Effect.SpecialActivation) return symbols
    const clan = playerClan(rules, player)
    if (clan === undefined) return symbols
    return symbols + quantity * maxMilitary(rules, player, specialActivationEffects[clan], { ...source, from: Effect.SpecialActivation })
  }, 0)
}

/** The symbols a player could still gather off a list of squares of their own grid. */
export const militaryFromCells = (rules: Rules, player: number, cells: XYCoordinates[]): number =>
  cells.reduce((symbols, cell) => {
    const effects = squareEffects(rules, player, cell)
    return effects === undefined ? symbols : symbols + maxMilitary(rules, player, effects, squareSource(rules, player, cell))
  }, 0)

/**
 * The military symbols the opponent is expected to end the round on: what they have gathered, plus the most their
 * side of the zone can still give them. An upper bound, deliberately: a bot that gambles on its opponent leaving
 * symbols on the table is a bot that loses conflicts it had in hand.
 */
export const expectedOpponentSymbols = (rules: Rules, player: number): number => {
  const opponent = rules.game.players.find((other) => other !== player) ?? player
  return militarySymbols(rules, opponent) + militaryFromCells(rules, opponent, activableCells(rules, opponent))
}

/** The symbols worth reaching: 1 more than the opponent is expected to gather, which is what wins the conflict. */
export const militaryNeed = (rules: Rules, player: number): number => expectedOpponentSymbols(rules, player) + 1

/**
 * How much better a zone is for the AI than for its opponent: what its 4 squares give here, less what the same 4
 * squares give over there.
 *
 * Both sides are read with the eyes of their owner, their own clan and their own Victory condition card, since
 * that is what a square is worth to the player who activates it: 2 military symbols are worth a conflict to a
 * Scorpion and a ninth of one to a Shark.
 *
 * The military of each side is priced against what the other one can reach on that very zone, which is the whole
 * of the comparison: a zone that hands the AI 2 symbols is a good zone against an opponent who gets 1 there, and
 * a bad one against an opponent who gets 3.
 */
export const zoneAdvantage = (ai: Ai, zone: ActionZone): number => {
  const cells = zoneCells(zone)
  const opponent = aiPlayer(ai.rules, ai.opponent)
  const mine = militaryFromCells(ai.rules, ai.player, cells)
  const theirs = militaryFromCells(ai.rules, ai.opponent, cells)
  const me = withMilitaryNeed(ai, theirs + militarySymbols(ai.rules, ai.opponent) + 1)
  const them = withMilitaryNeed(opponent, mine + militarySymbols(ai.rules, ai.player) + 1)
  const myGain = sumGains(cells.map((cell) => squareGain(me, cell)))
  const theirGain = sumGains(cells.map((cell) => squareGain(them, cell, ai.opponent)))
  return gainValue(me, myGain) - gainValue(them, theirGain, militarySymbols(ai.rules, ai.opponent))
}

/** The tiles of a grid, and what turning one over is worth. */

/** The square a tile of a grid stands on. */
export const cellOfTile = (rules: Rules, index: number): XYCoordinates => cellOf(rules.material(MaterialType.Tile).getItem(index).location)

/** What a face of a tile gives, on the round it is activated or on every round to come. */
const faceValue = (ai: Ai, index: number, flipped: boolean, future: boolean): number => {
  const tile = ai.rules.material(MaterialType.Tile).getItem<TileId>(index)
  if (tile === undefined) return 0
  const gain = effectsGain(ai, tileEffects(tile.id!, flipped), { item: { type: MaterialType.Tile, index } })
  return future ? futureValue(ai, gain) : gainValue(ai, gain)
}

/**
 * What upgrading a tile is worth: what its upgraded face gives, less what the face it is showing gives.
 * Always read on the rounds ahead, an upgrade being the definition of something that pays later.
 */
export const upgradeGain = (ai: Ai, index: number): number => {
  const tile = ai.rules.material(MaterialType.Tile).getItem<TileId>(index)
  if (tile === undefined || !isPermanent(tile.id!)) return 0
  return faceValue(ai, index, true, true) - faceValue(ai, index, false, true)
}

/** What a tile gives on the face it is showing, right now, which is what activating it out of turn is worth. */
export const tileValue = (ai: Ai, index: number): number =>
  faceValue(ai, index, ai.rules.material(MaterialType.Tile).getItem(index)?.location.rotation === true, false)

/** The same, on the rounds to come, which is what turning a tile over costs or earns its owner. */
export const tileFutureValue = (ai: Ai, index: number): number =>
  faceValue(ai, index, ai.rules.material(MaterialType.Tile).getItem(index)?.location.rotation === true, true)

/** What the front of a tile gives from now on, which is what a Flip turns a Desert back over for. */
export const tileFrontFutureValue = (ai: Ai, index: number): number => faceValue(ai, index, false, true)

/** The Pack of the Sharks, which is where their tokens sit rather than an effect of its own. */

/** The squares of the AI's grid holding one of its Shark cards, which are the cards a Pack ever wakes up. */
export const sharkCardCells = (ai: Ai): { cell: XYCoordinates; front: ClanCardId }[] =>
  gridCells.flatMap((cell) => {
    const front = topCardOn(ai.rules, ai.player, cell)
    return front !== undefined && clanOf(front) === Clan.Shark ? [{ cell, front }] : []
  })

/** Whether a square surrounded by that set of tokens gives its Pack effect: a token on it, and 2 around it. */
const isPackAwake = (tokens: XYCoordinates[], cell: XYCoordinates): boolean =>
  tokens.some((token) => sameCell(token, cell)) && tokens.filter((token) => areAdjacentSquares(token, cell)).length >= 2

/**
 * What the Shark cards of a grid are worth with the tokens laid out that way: each card read on the face those
 * tokens leave up, weighted by how often its square will be activated.
 *
 * This is the whole of how the AI plays the Sharks: it never counts tokens or measures shapes, it prices the board
 * the tokens make. A card played next to 2 others is worth what its Pack effect gives instead of its printed one,
 * and the 4 cards of a square are worth 4 Pack effects, which is what a square of 4 is for.
 */
export const packValue = (ai: Ai, tokens: XYCoordinates[], cards = sharkCardCells(ai)): number =>
  cards.reduce((value, { cell, front }) => {
    const face = clanCardEffects(front, isPackAwake(tokens, cell))
    return value + futureValue(ai, effectsGain(ai, face)) * cellOutlook(ai, cell)
  }, 0)

/**
 * How far a square is from the Pack already on the grid, as the mean distance to the tokens that are out.
 *
 * What it buys is the first half of a Pack, which is worth nothing yet and everything soon: 2 lone tokens wake
 * nothing up, and the 3rd one laid in the corner between them wakes itself up and lets the 4th wake all 4. Without
 * this the AI would see 3 identical squares and only find that out one card too late.
 */
export const distanceToPack = (tokens: XYCoordinates[], cell: XYCoordinates): number =>
  tokens.length === 0 ? 0 : tokens.reduce((sum, token) => sum + Math.abs(token.x - cell.x) + Math.abs(token.y - cell.y), 0) / tokens.length

/** The squares of the AI's grid holding one of its Shark tokens. */
export const myTokenCells = (ai: Ai): XYCoordinates[] => sharkTokenCells(ai.rules, ai.player)

/**
 * What laying one more token on a square would be worth: the Packs it wakes up, all over the grid, less the pull
 * towards the tokens already out, which is what turns a scattering of tokens into a block.
 * A square that already has one takes no other: the rules leave it where it is (see {@link sharkMoves}).
 */
export const tokenGain = (ai: Ai, cell: XYCoordinates, cards = sharkCardCells(ai)): number => {
  const tokens = myTokenCells(ai)
  if (tokens.some((token) => sameCell(token, cell))) return 0
  const after = [...tokens, cell]
  return packValue(ai, after, cards) - packValue(ai, tokens, cards) - distanceToPack(tokens, cell)
}

/** Whether the card the AI is about to play on a square would land with its Pack awake. */
export const packWouldBeAwake = (ai: Ai, cell: XYCoordinates): boolean => {
  const tokens = myTokenCells(ai)
  return isPackAwake(tokens.some((token) => sameCell(token, cell)) ? tokens : [...tokens, cell], cell)
}

/**
 * Whether a square holds a Desert: a temporary tile, already activated, that nothing covers.
 * The one square a card can be played on for free, its tile having nothing left to give (see {@link coverPenalty}).
 */
export const isDesertCell = (ai: Ai, cell: XYCoordinates): boolean => {
  if (topCardIndexOn(ai.rules, ai.player, cell) !== undefined) return false
  const tile = tileAt(ai.rules.material(MaterialType.Tile), ai.player, cell).getItem<TileId>()
  return tile !== undefined && !isPermanent(tile.id!) && tile.location.rotation === true
}
