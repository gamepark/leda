import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { Memory } from './Memory'
import { cardsOwed } from './organisation'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The price of the 3 Cat cards that are paid with cards rather than with Food: their owner puts as many cards of
 * their hand under their deck, one at a time and in the order of their choice.
 *
 * Paid once the card is on its square, exactly where the Food of every other card is taken, and for the same
 * reason: what a price is paid with is the player's to pick, and the card being bought is the one card of the
 * hand that cannot pay for itself, being already gone by then.
 *
 * Under the deck rather than out of the game: a clan is its 13 or 11 cards and nothing else, so a card that is
 * spent is only sent to the far end of the pile, which is where a Ring traded for a token goes
 * (see {@link SpendRingForTokenRule}). Its owner will have to draw their whole deck to see it again.
 */
export class PayCardCostRule extends EffectRule {
  /**
   * A card is never played unless its owner holds what it costs (see {@link playCardMoves}), so there is always
   * enough here, and each card paid takes one off both sides of that. A debt this hand could not pay would leave
   * the game waiting on a player with nothing to play, hence it being written off rather than owed forever.
   */
  onRuleStart(): Move[] {
    const owed = cardsOwed(this)
    return owed > 0 && owed <= this.hand.length ? [] : this.paid()
  }

  getPlayerMoves(): Move[] {
    // x 0 is the far end of the pile, which the deck draws from the other side of (see {@link DeckLocator}).
    return this.hand.moveItems({ type: LocationType.PlayerDeck, player: this.player, x: 0 })
  }

  /** One card of the price, and the game goes back to what was interrupted once the last of them is paid. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.type !== LocationType.PlayerDeck) return []
    const owed = cardsOwed(this) - 1
    this.memorize(Memory.CardsOwed, owed)
    return owed > 0 ? [] : this.paid()
  }

  /** Nothing is owed any more, and nothing has to remember it: what is next is what was waiting. */
  paid(): Move[] {
    this.forget(Memory.CardsOwed)
    return this.resume()
  }

  /** A hand is secret, so on the client of the opponent these are the backs of a clan and nothing more. */
  get hand() {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(this.player)
  }
}
