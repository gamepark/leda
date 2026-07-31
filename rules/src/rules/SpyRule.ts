import { MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { pileTop, putBackMoves, spiedItem, spiedPiles } from './spy'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * A Spy effect: the player looks in secret at the first item of a pile of their choice, their own deck, the pile
 * of Action tiles or the pile of Military Victory tokens, then puts it back on top of or under that pile.
 *
 * Taking the item out of its pile is what shows it: {@link LocationType.SpiedItem} hides it from everyone but the
 * player it belongs to, so the framework reveals it to them alone. Their opponent sees which pile is being looked
 * into, and nothing more, exactly as they would around a table.
 */
export class SpyRule extends EffectRule {
  /** Every pile empty at once would leave nothing to look at, and a rule with no move would hang the game. */
  onRuleStart(): Move[] {
    return this.getPlayerMoves().length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    const back = putBackMoves(this, this.player)
    return back === undefined ? this.lookMoves() : [back.onTop, back.under]
  }

  lookMoves(): Move[] {
    return spiedPiles.flatMap((pile) => pileTop(this, this.player, pile).moveItems({ type: LocationType.SpiedItem, player: this.player }))
  }

  /** The player makes 2 moves: taking an item, then putting it back. The second one is the end of the effect. */
  afterItemMove(): Move[] {
    return spiedItem(this) === undefined ? this.resume() : []
  }
}
