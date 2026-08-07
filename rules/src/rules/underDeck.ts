import { Material, MaterialMove } from '@gamepark/rules-api'
import { ClanCardItemId } from '../material/ClanCardId'
import { isRing } from '../material/clanCards/catCards'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Rules } from '../Rules'
import { RuleId } from './RuleId'

type Cards = Material<number, MaterialType, LocationType>

/** The cards a player holds. A hand is secret, so on the client of their opponent these have no front to read. */
export const hand = (rules: Rules, player: number): Cards => rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(player)

/** The Rings among them, which are 4 of the 13 cards of the Cats and the only ones a token is ever traded for. */
export const ringsInHand = (rules: Rules, player: number): Cards =>
  hand(rules, player).id<ClanCardItemId>((id) => id.front !== undefined && isRing(id.front))

/**
 * Putting cards under the deck of their owner, one at a time: x 0 is the far end of the pile, which the deck draws
 * from the other side of (see {@link PlayerDeckLocator}).
 * Under the deck rather than out of the game: a clan is its 13 or 11 cards and nothing else, so a card that is
 * spent is only sent as far from the top of the pile as it goes, and its owner has to draw their whole deck to
 * see it again.
 */
export const underDeckMoves = (cards: Cards, player: number): MaterialMove<number, MaterialType, LocationType>[] =>
  cards.moveItems({ type: LocationType.PlayerDeck, player, x: 0 })

/**
 * The cards of their own hand a player is being asked to put under their deck right now, and nothing at all when
 * they are being asked no such thing: the price of a Cat card paid in cards, which any card of the hand pays
 * (see {@link PayCardCostRule}), and a Ring traded for a Military Victory token, which only a Ring pays
 * (see {@link SpendRingForTokenRule}).
 *
 * Read by the app to know which cards carry the button that gives one (see {@link PutUnderDeckButton}), against
 * the same helpers the 2 rules build their moves with, so that a button can never offer what is not legal.
 */
export const cardsToPutUnderDeck = (rules: Rules, player: number): Cards | undefined => {
  switch (rules.game.rule?.id) {
    case RuleId.PayCardCost:
      return hand(rules, player)
    case RuleId.SpendRingForToken:
      return ringsInHand(rules, player)
    default:
      return undefined
  }
}
