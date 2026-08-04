import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { ClanCardItemId } from '../material/ClanCardId'
import { isRing } from '../material/clanCards/catCards'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { queueFirstRule } from './effects'
import { RuleId } from './RuleId'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Cat card reads as "you may reveal a Ring from your hand and put it under your deck to draw and resolve 1
 * Military Victory token": a Ring is worth a token, and the trade is the player's to refuse, hence the pass.
 *
 * A Ring is one of the 3 the clan needs to win, so this is a real price rather than a formality: it goes back
 * under the deck, which is the far end of it, and the player will have to draw the whole deck to see it again.
 * Revealing is what putting it back does, the move being public, so the opponent sees which Ring was spent.
 */
export class SpendRingForTokenRule extends EffectRule {
  /** A player with no Ring in hand has nothing to trade, and the effect is lost rather than refused. */
  onRuleStart(): Move[] {
    return this.rings.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    // x 0 is the far end of the pile, which the deck draws from the other side of (see {@link DeckLocator}).
    return [...this.rings.moveItems({ type: LocationType.PlayerDeck, player: this.player, x: 0 }), this.customMove(CustomMoveType.Pass, this.player)]
  }

  /** The Rings the player holds. A hand is secret, so only its owner ever reads the fronts of these. */
  get rings() {
    return this.material(MaterialType.ClanCard)
      .location(LocationType.PlayerHand)
      .player(this.player)
      .id<ClanCardItemId>((id) => id.front !== undefined && isRing(id.front))
  }

  /** The token is drawn and resolved by the rule that does it everywhere else, queued ahead of what was waiting. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.type !== LocationType.PlayerDeck) return []
    queueFirstRule(this, RuleId.MilitaryVictory)
    return this.resume()
  }

  onCustomMove(move: CustomMove): Move[] {
    return isCustomMoveType(CustomMoveType.Pass)(move) ? this.resume() : []
  }
}
