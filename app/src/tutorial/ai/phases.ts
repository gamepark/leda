import { Clan } from '@gamepark/leda/Clan'
import { ActionZone, actionZoneCells } from '@gamepark/leda/material/ActionZone'
import { ClanCardId, ClanCardItemId, clanOf } from '@gamepark/leda/material/ClanCardId'
import { isRing } from '@gamepark/leda/material/clanCards/catCards'
import { Effect, effectEntries, EffectSet, isEffectChoice } from '@gamepark/leda/material/Effect'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { activableCells, squareEffects } from '@gamepark/leda/rules/activation'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { cardCardCost, cardFoodCost } from '@gamepark/leda/rules/organisation'
import { topCardOn } from '@gamepark/leda/rules/squares'
import { isCreateItemType, isCustomMoveType, isMoveItemType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { sample } from 'es-toolkit'
import { Ai, bestOf, gainValue, Scored } from './AiPlayer'
import { playCardValue, spendingPenalty, swapValue } from './cards'
import { cellOfTile, squareGain, zoneAdvantage } from './grid'
import { isPass } from './effects'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The 3 phases every round goes through, and the setup that opens the game: the decisions the AI takes on its own
 * turn rather than because an effect asked it something (see {@link effects}).
 */

/**
 * Setup step 6: which clan to take, picked at random among the ones nobody has taken yet.
 *
 * Nothing is ranked here, and nothing could be: the 4 clans of the box are balanced against one another, and a
 * clan is picked before a single card of it has been drawn, so there is no state of the game to read it off.
 * Drawing lots is also what keeps the opponent worth playing again: a bot that always sits down as the same clan
 * is a bot that only ever plays one of the 4 games this box holds.
 * The tutorial is not affected: it names the clans its script needs rather than leaving them to this.
 */
export const chooseClan = (moves: Move[]): Move | undefined =>
  sample(moves.filter((move) => isCustomMoveType<CustomMoveType, Clan>(CustomMoveType.ChooseClan)(move) && move.data !== undefined))

/**
 * End of setup step 6: whether to shuffle the starting hand back and draw as many cards again.
 *
 * A player starts with 1 Food and 3 cards, so nothing in that hand is playable on the first round whatever it
 * holds: what makes a hand bad is not its price but the cards that can never be bought at all. The Silver and Gold
 * Pandas are awakened rather than paid for, and a Panda holding 2 of them is holding 2 blanks until they have a
 * group of Bronze ones on the grid to raise.
 */
export const mulligan = (ai: Ai, moves: Move[]): Move | undefined => {
  const costs = ai.rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayerHand)
    .player(ai.player)
    .getItems<ClanCardItemId>()
    .map((card) => startingCost(ai, card.id?.front))
  const unbuyable = costs.filter((cost) => !Number.isFinite(cost)).length
  const cheapest = Math.min(...costs)
  const redraw = unbuyable >= 2 || cheapest > 6
  return moves.find((move) => (redraw ? isCustomMoveType(CustomMoveType.Mulligan)(move) : isPass(move))) ?? moves[0]
}

/** What a card of the starting hand costs, and Infinity for the ones no amount of Food ever buys. */
const startingCost = (ai: Ai, front?: ClanCardId): number => {
  if (front === undefined) return Infinity
  const food = cardFoodCost(ai.rules, ai.player, front)
  if (food !== undefined) return food
  const cards = cardCardCost(front)
  // A price in cards is paid out of a hand of 3, so it is dear early on, but it is a price that can be paid.
  return cards === undefined ? Infinity : cards * 2
}

/**
 * Phase 1: which of the zones the revealed Action tile offers.
 *
 * Both grids are scored on the same 4 squares, each with the eyes of its own owner, and the zone taken is the one
 * that leaves the widest gap (see {@link zoneAdvantage}). Picking the zone that gives the most, without looking
 * across the table, is how a bot hands its opponent a round of 3 military symbols to gain 2 Food.
 */
export const chooseAction = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(
    moves.flatMap((move) => {
      if (!isCustomMoveType<CustomMoveType, ActionZone>(CustomMoveType.ChooseAction)(move) || move.data === undefined) return []
      return [{ move, score: zoneAdvantage(ai, move.data) + purpleRingBonus(ai, move.data) }]
    })
  )

/**
 * The Purple Ring of the Cats is put in play by activating a zone holding 3 Cat cards, which is the one condition
 * of the 4 that is met by picking a zone rather than by building towards it (see {@link ringPlacements}).
 */
const purpleRingBonus = (ai: Ai, zone: ActionZone): number => {
  if (ai.clan !== Clan.Cat || !holdsPurpleRing(ai)) return 0
  const cats = actionZoneCells[zone].filter((cell) => {
    const card = topCardOn(ai.rules, ai.player, cell)
    return card !== undefined && clanOf(card) === Clan.Cat
  }).length
  return cats >= 3 ? 9 : 0
}

const holdsPurpleRing = (ai: Ai): boolean =>
  ai.rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayerHand)
    .player(ai.player)
    .getItems<ClanCardItemId>()
    .some((card) => card.id?.front === ClanCardId.CatRingThreeCatCards)

/**
 * Phase 1, once the zone is known: which square of it to activate next. The rulebook leaves the order to the
 * player, and the order is worth something: a square that upgrades a tile, turns a Desert back over, plays a card
 * or moves 2 squares around changes what the squares of the zone that are still waiting will give.
 *
 * So anything that reaches the rest of the zone goes first, and the rest follows in the order of what it gives.
 * That is the whole of "improve a tile before activating it": the Upgrade is resolved while there is still a
 * square of the zone to land it on (see {@link upgradeTile}).
 */
export const activateZone = (ai: Ai, moves: Move[]): Move | undefined => {
  const left = activableCells(ai.rules, ai.player).length
  return bestOf(
    moves.flatMap((move) => {
      if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move) || move.data === undefined) return []
      const cell = move.data
      const effects = squareEffects(ai.rules, ai.player, cell)
      const opens = left > 1 && effects !== undefined && reachesTheZone(effects) ? 100 : 0
      return [{ move, score: opens + gainValue(ai, squareGain(ai, cell)) }]
    })
  )
}

/**
 * The effects that change what the squares still waiting in the zone are going to give: a tile turned onto its
 * better face, a Desert turned back over, a card played onto a square that has not been resolved yet, and 2
 * squares that change places.
 */
const zoneOpeners: Effect[] = [Effect.Upgrade, Effect.Flip, Effect.PlayCard, Effect.SwapSquares]

const reachesTheZone = (effects: EffectSet): boolean =>
  isEffectChoice(effects)
    ? effects.or.some(reachesTheZone)
    : effectEntries(effects).some(([effect]) => zoneOpeners.includes(effect))

/**
 * Phase 3, the organisation: play one card from the hand, or swap 2 squares and gain 1 Food for it, or simply
 * take the Food.
 *
 * Cards come first, and are given a bonus for it: a card played is a square of the grid for the rest of the game,
 * where a swap only moves what is already there and the Food is what is left when neither is worth doing. The one
 * clan that holds back is the Scorpions, whose Portals are what their Food is for (see {@link spendingPenalty}).
 */
export const organise = (ai: Ai, moves: Move[]): Move | undefined => {
  const food = ai.weights[Effect.Food]
  return bestOf(
    moves.flatMap((move): Scored<Move>[] => {
      if (isMoveItemType(MaterialType.ClanCard)(move) && move.location.type === LocationType.PlayedCard && move.location.parent !== undefined) {
        const front = ai.rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex)?.id?.front
        const priority = front !== undefined && isRing(front) ? 0 : cardPriority
        return [{ move, score: playCardValue(ai, move.itemIndex, move.location.parent) + priority - (front === undefined ? 0 : spendingPenalty(ai, front)) }]
      }
      if (isMoveItemType(MaterialType.Tile)(move)) {
        // A swap is worth the Food it earns on top of what moving the 2 squares is worth.
        return [{ move, score: swapValue(ai, cellOfTile(ai.rules, move.itemIndex), cellOf(move.location)) + food }]
      }
      // Taking the Food and leaving the grid alone, which is what a player does when neither of the others pays.
      if (isCreateItemType(MaterialType.FoodToken)(move)) return [{ move, score: food }]
      return []
    })
  )
}

/**
 * What playing a card is worth beyond what the card gives: a hand is only ever emptied one card per round, so a
 * round spent not playing one is a card that will still be in hand 10 rounds from now. Enough to beat the Food a
 * swap earns, not enough to buy a card the grid has no room for.
 */
const cardPriority = 2
