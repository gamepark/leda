import { MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { ClanCardId, ClanCardItemId } from '../material/ClanCardId'
import { clanCardCardCost, clanCardFoodCost } from '../material/clanCards/cardProperties'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { gridTiles } from '../material/PlayerGrid'
import { Rules } from '../Rules'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * Where the organisation of a grid stands, and what playing a card out of a hand costs and looks like, which the
 * organisation is not the only moment for: an effect may let a player play one in the middle of their activation,
 * at a discount (see {@link PlayCardRule}). The app reads it all to know what to offer on the table, and the rules
 * to know what is legal, so that the two can never disagree.
 */

/**
 * The player who is organising their grid, if any: the only one who may swap 2 of their squares, and the only
 * one whose grid has to let a tile be taken from under the cards played on it.
 */
export const organisingPlayer = (rules: Rules): number | undefined =>
  rules.game.rule?.id === RuleId.Organisation ? rules.game.rule.player : undefined

/** The Food a player owns, which is what they pay for the cards they play. */
export const playerFood = (rules: Rules, player: number): number =>
  rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(player).getQuantity()

/**
 * What a card costs its owner in Food, a discount taken off, and undefined when it cannot be bought with Food at
 * all: a Ring, a Cat card paid with cards from the hand, or a Panda that is awakened rather than bought.
 * Undefined too when nobody here knows which card it is, a hand being secret (see {@link revealedFront}).
 */
export const cardFoodCost = (rules: Rules, player: number, front?: ClanCardId, discount = 0): number | undefined => {
  if (front === undefined) return undefined
  const cost = clanCardFoodCost(front, rules, player)
  return cost === undefined ? undefined : Math.max(0, cost - discount)
}

/**
 * What a card costs its owner in cards from their own hand, and undefined for every card that is not one of the
 * 3 Cat cards paid that way. Undefined too when nobody here knows which card it is, a hand being secret.
 *
 * No discount is ever taken off it: what an effect discounts is a price in Food, and a card paid with cards has
 * none (see {@link Effect.PlayCard}).
 */
export const cardCardCost = (front?: ClanCardId): number | undefined => (front === undefined ? undefined : clanCardCardCost(front))

/**
 * How many cards their owner still owes for the card they have just played, and 0 when nothing is due
 * (see {@link Memory.CardsOwed}).
 */
export const cardsOwed = (rules: Rules): number => rules.game.memory[Memory.CardsOwed] ?? 0

/**
 * Playing one card from the hand onto any of the 16 squares of the player's own grid, provided they can pay for
 * it. A card is played on the tile of the square rather than on the square itself, hence the parent of its
 * location (see {@link LocationType.PlayedCard}).
 */
export const playCardMoves = (rules: Rules, player: number, discount = 0): MaterialMove<number, MaterialType, LocationType>[] => {
  const food = playerFood(rules, player)
  const cards = rules.material(MaterialType.ClanCard)
  const hand = cards.location(LocationType.PlayerHand).player(player)
  /** What is left of the hand once a card of it is played, which is what a card paid with cards is paid with. */
  const rest = hand.length - 1
  const parents = gridTiles(rules.material(MaterialType.Tile), player).getIndexes()
  return hand.getIndexes().flatMap((index) => {
    if (!canPayFor(rules, player, cards.getItem<ClanCardItemId>(index).id?.front, food, rest, discount)) return []
    return parents.map((parent) => cards.index(index).moveItem({ type: LocationType.PlayedCard, player, parent }))
  })
}

/**
 * Whether the player can pay the price of that card: the Food it costs, or the cards it costs, taken from the
 * hand it leaves behind. A card that is never bought cannot be paid for at all, nor can one nobody here knows.
 */
const canPayFor = (rules: Rules, player: number, front: ClanCardId | undefined, food: number, rest: number, discount: number): boolean => {
  const cards = cardCardCost(front)
  if (cards !== undefined) return cards <= rest
  const cost = cardFoodCost(rules, player, front, discount)
  return cost !== undefined && cost <= food
}

/**
 * What follows a player being done organising their grid: their opponent organises their own, and once both have,
 * the round is over.
 * Shared by the moves that end an organisation and by the price in cards that may be paid after one of them
 * (see {@link EndOfOrganisationRule}).
 */
export const afterOrganisation = (rule: PlayerTurnRule<number, MaterialType, LocationType>): MaterialMove<number, MaterialType, LocationType>[] =>
  rule.player === rule.remind<number>(Memory.RoundPlayer)
    ? [rule.startPlayerTurn(RuleId.Organisation, rule.nextPlayer)]
    : [rule.startRule(RuleId.EndOfRound)]
