import { MaterialMove } from '@gamepark/rules-api'
import { ClanCardId, ClanCardItemId } from '../material/ClanCardId'
import { clanCardFoodCost } from '../material/clanCards/cardProperties'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { gridTiles } from '../material/PlayerGrid'
import { Rules } from '../Rules'
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
 * Playing one card from the hand onto any of the 16 squares of the player's own grid, provided they own the Food
 * it costs. A card is played on the tile of the square rather than on the square itself, hence the parent of its
 * location (see {@link LocationType.PlayedCard}).
 */
export const playCardMoves = (rules: Rules, player: number, discount = 0): MaterialMove<number, MaterialType, LocationType>[] => {
  const food = playerFood(rules, player)
  const cards = rules.material(MaterialType.ClanCard)
  const hand = cards.location(LocationType.PlayerHand).player(player)
  const parents = gridTiles(rules.material(MaterialType.Tile), player).getIndexes()
  return hand.getIndexes().flatMap((index) => {
    const cost = cardFoodCost(rules, player, cards.getItem<ClanCardItemId>(index).id?.front, discount)
    if (cost === undefined || cost > food) return []
    return parents.map((parent) => cards.index(index).moveItem({ type: LocationType.PlayedCard, player, parent }))
  })
}
