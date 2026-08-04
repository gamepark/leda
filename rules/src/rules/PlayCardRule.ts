import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove, MaterialMove, MoveItem } from '@gamepark/rules-api'
import { ClanCardItemId, revealedFront } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { Memory } from './Memory'
import { cardFoodCost, playCardMoves } from './organisation'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What the Pandas write as "you may play a Panda card from your hand, reducing its Food cost by 1": the player
 * plays one card out of turn, in the middle of their activation, and pays what it costs less the discount.
 *
 * "May", hence the move that turns it down: a player who has the cards for it is still free to keep them, which
 * is not the same as having none. What they play is not activated on the spot either, exactly as during an
 * organisation: a card gives what it gives when the square it sits on is activated.
 */
export class PlayCardRule extends EffectRule {
  /** Nothing to play leaves nothing to ask, and turning down what cannot be done is not a decision. */
  onRuleStart(): Move[] {
    return this.playCardMoves.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return [...this.playCardMoves, this.customMove(CustomMoveType.Pass)]
  }

  get playCardMoves(): Move[] {
    return playCardMoves(this, this.player, this.discount)
  }

  /** What the effect that opened this takes off the price of the card (see {@link Memory.CardDiscount}). */
  get discount(): number {
    return this.remind<number>(Memory.CardDiscount) ?? 0
  }

  /**
   * The price of the card, read before it leaves the hand: a Portal counts the cards of the hand it is still part
   * of, and what is returned here is played after the move all the same (see {@link FoodCost}).
   */
  beforeItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!this.isCardPlayed(move)) return []
    const front = revealedFront(move) ?? this.material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex).id?.front
    const cost = cardFoodCost(this, this.player, front, this.discount) ?? 0
    return cost > 0 ? [this.food.deleteItem(cost)] : []
  }

  /** Playing a card is the whole of this rule, and so is turning the chance to play one down. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    return this.isCardPlayed(move) ? this.resume() : []
  }

  onCustomMove(move: CustomMove): Move[] {
    return isCustomMoveType(CustomMoveType.Pass)(move) ? this.resume() : []
  }

  isCardPlayed(move: ItemMove<number, MaterialType, LocationType>): move is MoveItem<number, MaterialType, LocationType> {
    return isMoveItemType(MaterialType.ClanCard)(move) && move.location.type === LocationType.PlayedCard
  }

  get food() {
    return this.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(this.player)
  }
}
