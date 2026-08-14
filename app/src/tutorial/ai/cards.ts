import { Clan } from '@gamepark/leda/Clan'
import { ClanCardId, ClanCardItemId, clanOf } from '@gamepark/leda/material/ClanCardId'
import { isRing } from '@gamepark/leda/material/clanCards/catCards'
import { clanCardEffects } from '@gamepark/leda/material/clanCards/cardProperties'
import { PandaLevel } from '@gamepark/leda/material/clanCards/PandaLevel'
import { isPortal } from '@gamepark/leda/material/clanCards/scorpionCards'
import { Effect, EffectSet } from '@gamepark/leda/material/Effect'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { gridCorners, gridTiles, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { pandaLevel } from '@gamepark/leda/rules/awakening'
import { cardCardCost, cardFoodCost, playerFood } from '@gamepark/leda/rules/organisation'
import { topCardOn } from '@gamepark/leda/rules/squares'
import { XYCoordinates } from '@gamepark/rules-api'
import { Ai, effectsGain, futureValue } from './AiPlayer'
import {
  cellOfTile,
  cellOutlook,
  isDesertCell,
  myTokenCells,
  packValue,
  packWouldBeAwake,
  sharkCardCells,
  squareFutureValue,
  tokenGain,
  weightedCellValue
} from './grid'

/**
 * What playing a card on a square is worth, and what moving 2 squares around is worth. The 2 decisions of phase 3,
 * and the 2 things the clans of this box are actually played differently for: the Sharks want their cards next to
 * each other, the Scorpions want their Portals in the corners, the Cats want their Rings on the table and the
 * Pandas want theirs uncovered, so that an Awakening still has a group of 2 to raise.
 */

/** What a square of the grid is worth having a good tile on, which is where a swap sends the good ones. */
const isCorner = (cell: XYCoordinates): boolean => gridCorners.some((corner) => sameCell(corner, cell))

/** What a card gives once it is played on a square, which for a Shark card is whatever the tokens leave up. */
export const playedEffects = (ai: Ai, front: ClanCardId, cell: XYCoordinates): EffectSet =>
  clanOf(front) === Clan.Shark ? clanCardEffects(front, packWouldBeAwake(ai, cell)) : clanCardEffects(front)

/**
 * What a card costs its owner, in the currency of the AI.
 *
 * Food is not worth the same to everyone on the way out as on the way in: the Scorpions need theirs for Portals
 * that cost up to 9, so every other card they buy has to be worth the delay it puts on the next Portal, which is
 * the whole of "do not play too many cards" (see {@link clanFoodCost}). A Portal itself is priced at half, being
 * the very thing that Food is being kept for.
 *
 * The 3 Cat cards paid with cards from the hand are priced at what a card is worth to their clan, less a third:
 * a card put under the deck is not lost, it is at the far end of a pile its owner is trying to empty anyway.
 */
export const cardCost = (ai: Ai, front: ClanCardId, discount = 0): number => {
  const food = cardFoodCost(ai.rules, ai.player, front, discount)
  if (food !== undefined) return food * (isPortal(front) ? 0.5 : ai.foodCost)
  const cards = cardCardCost(front)
  return cards === undefined ? 0 : cards * 0.7 * ai.weights[Effect.Draw]
}

/**
 * What buying a card costs its owner beyond its price: the card they will not be buying next.
 *
 * Only the Scorpions ever pay it, and only because their Portals do: those are what wins them the game, they cost
 * up to 9 Food, and every 3 Food card played before one is a round the Portal is not on the table. That is the
 * whole of "do not play too many cards", written where it belongs, on the Food that is left rather than on the
 * card being played.
 */
export const spendingPenalty = (ai: Ai, front: ClanCardId, discount = 0): number => {
  if (ai.clan !== Clan.Scorpion || isPortal(front)) return 0
  const portals = ai.rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayerHand)
    .player(ai.player)
    .getItems<ClanCardItemId>()
    .flatMap((card) => (card.id?.front !== undefined && isPortal(card.id.front) ? [cardFoodCost(ai.rules, ai.player, card.id.front) ?? 0] : []))
  if (portals.length === 0) return 0
  const cheapest = Math.min(...portals)
  const left = playerFood(ai.rules, ai.player) - (cardFoodCost(ai.rules, ai.player, front, discount) ?? 0)
  return left < cheapest ? 2 + (cheapest - left) * 0.6 : 0
}

/**
 * What playing a card on a square buries, which is the whole reason a grid is not 16 equally good squares.
 *
 * A card covers the tile of its square, and covers whatever card was already standing there: what it buries stops
 * giving anything, stops being counted by the Victory condition card of the clan, and stops being a Desert the
 * Scorpions count in pairs. All 3 are lost for the rest of the game, hence the loss being read over the rounds
 * ahead exactly as the gain is (see {@link cellOutlook}).
 */
export const coverPenalty = (ai: Ai, cell: XYCoordinates): number => {
  let penalty = weightedCellValue(ai, cell)
  const covered = topCardOn(ai.rules, ai.player, cell)
  if (covered !== undefined) penalty += victoryValue(ai, covered, cell)
  // A Desert under a card is a Desert nobody counts, and half of what the Scorpion cards read is those pairs.
  else if (ai.clan === Clan.Scorpion && isDesertCell(ai, cell)) penalty += 0.8
  return penalty
}

/**
 * What a card is worth to the race its clan is running, on the square it stands on. Nothing to do with what it
 * gives: these are the cards the Victory condition card counts, and burying one is losing a step of the game.
 */
export const victoryValue = (ai: Ai, front: ClanCardId, cell: XYCoordinates): number => {
  switch (ai.clan) {
    case Clan.Cat:
      // 3 Rings in play win the game, and there are only 4 of them.
      return isRing(front) ? 9 : 0
    case Clan.Scorpion:
      // The 4 Portals win the game in the 4 corners, and are worth having in play anywhere on their way there.
      return isPortal(front) ? (isCorner(cell) ? 12 : 3) : 0
    case Clan.Panda: {
      const level = pandaLevel(front)
      if (level === PandaLevel.Gold) return 10
      // Every other Panda is half of the group of 2 an Awakening needs to raise one (see {@link AwakeningRule}).
      return level === undefined ? 0 : 2
    }
    default:
      return 0
  }
}

/**
 * What playing a card of the hand onto one of the 16 tiles of the grid is worth.
 *
 * Everything is priced over the rounds ahead rather than over the round being played: a card is a square of the
 * grid from now on, and what it is worth is what that square will give, as often as the Action tiles still in the
 * pile say it will (see {@link cellOutlook}).
 */
export const playCardValue = (ai: Ai, cardIndex: number, tileIndex: number, discount = 0): number => {
  const front = ai.rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(cardIndex)?.id?.front
  if (front === undefined) return -Infinity
  const cell = cellOfTile(ai.rules, tileIndex)
  // The tile of the square is handed to the effects as what gives them, the card not being on the grid yet: what
  // a card reading its own surroundings reads is the square, and that is the square it is about to sit on.
  const gain = effectsGain(ai, playedEffects(ai, front, cell), { item: { type: MaterialType.Tile, index: tileIndex } })
  return (
    futureValue(ai, gain) * cellOutlook(ai, cell) -
    coverPenalty(ai, cell) -
    cardCost(ai, front, discount) +
    victoryValue(ai, front, cell) +
    packBonus(ai, front, cell)
  )
}

/**
 * What playing a Shark card somewhere does to the rest of the grid: the token it brings may wake the Pack of the
 * cards around it, which is worth more than anything the card itself gives.
 * Its own Pack is left out, being already part of what it gives (see {@link playedEffects}).
 */
const packBonus = (ai: Ai, front: ClanCardId, cell: XYCoordinates): number => {
  if (ai.clan !== Clan.Shark || clanOf(front) !== Clan.Shark) return 0
  const others = sharkCardCells(ai).filter((card) => !sameCell(card.cell, cell))
  // Every Shark card played takes a token out of the supply, so it is worth exactly what placing one is worth:
  // the 9 tokens on the grid are the whole of what that clan wins on (see {@link hasSpecialVictory}).
  return tokenGain(ai, cell, others) + ai.weights[Effect.PlaceSharkToken]
}

/** The best square of the grid for a card of the hand, and what it would be worth there. */
export const bestPlacement = (ai: Ai, cardIndex: number, discount = 0): { tile: number; value: number } | undefined => {
  const tiles = gridTiles(ai.rules.material(MaterialType.Tile), ai.player).getIndexes()
  if (tiles.length === 0) return undefined
  return tiles
    .map((tile) => ({ tile, value: playCardValue(ai, cardIndex, tile, discount) }))
    .reduce((best, placement) => (placement.value > best.value ? placement : best))
}

/** Swapping 2 squares of a grid, which the organisation pays 1 Food for and a Scorpion Portal gives away. */

/**
 * What swapping 2 squares of the grid is worth, whether the organisation is paying 1 Food for it or a Scorpion
 * Portal is offering it for free (see {@link swap}).
 *
 * The heart of it is the trade of one square's odds for the other's: a square that gives 2 Food is worth having
 * where the Action tiles still in the pile are likely to point, and a Desert is worth having where they are not.
 * That is what makes the swap worth anything at all, and it is worth nothing once the pile is down to its last
 * tile, since everything is shuffled back before it comes out: {@link cellOutlook} says so on its own, and the AI
 * takes the Food and leaves its grid alone.
 */
export const swapValue = (ai: Ai, a: XYCoordinates, b: XYCoordinates): number => {
  const [valueA, valueB] = [squareFutureValue(ai, a), squareFutureValue(ai, b)]
  const [outlookA, outlookB] = [cellOutlook(ai, a), cellOutlook(ai, b)]
  const moved = valueA * outlookB + valueB * outlookA - (valueA * outlookA + valueB * outlookB)
  return moved + portalSwapValue(ai, a, b) + packSwapValue(ai, a, b)
}

/** The 2 squares as they stand once swapped, which is what the clans below read the new grid off. */
const swapped = (a: XYCoordinates, b: XYCoordinates, cell: XYCoordinates): XYCoordinates =>
  sameCell(cell, a) ? b : sameCell(cell, b) ? a : cell

/**
 * What a swap does to the race of the Scorpions: their 4 Portals in the 4 corners win the game, and a Portal
 * played anywhere else is a Portal a swap can walk into one.
 */
const portalSwapValue = (ai: Ai, a: XYCoordinates, b: XYCoordinates): number => {
  if (ai.clan !== Clan.Scorpion) return 0
  const cornered = (cell: XYCoordinates, at: XYCoordinates): number => {
    const card = topCardOn(ai.rules, ai.player, cell)
    return card !== undefined && isPortal(card) && isCorner(at) ? 1 : 0
  }
  const before = cornered(a, a) + cornered(b, b)
  const after = cornered(a, b) + cornered(b, a)
  return 12 * (after - before)
}

/**
 * What a swap does to the Pack of the Sharks: a card and the token laid on it both follow their tile, so moving 2
 * squares is how a Shark gathers cards that were played wherever the Deserts happened to be.
 */
const packSwapValue = (ai: Ai, a: XYCoordinates, b: XYCoordinates): number => {
  if (ai.clan !== Clan.Shark) return 0
  const tokens = myTokenCells(ai)
  const cards = sharkCardCells(ai)
  const after = cards.map(({ cell, front }) => ({ cell: swapped(a, b, cell), front }))
  return packValue(ai, tokens.map((token) => swapped(a, b, token)), after) - packValue(ai, tokens, cards)
}
