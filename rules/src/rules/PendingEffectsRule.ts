import { MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { forgetPendingEffects, pendingEffects, resolveEffects } from './effects'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What is left of the effects of a square once one of them has asked the player something, given now that they
 * have answered (see {@link Memory.PendingEffects}).
 *
 * The one rule nobody plays: it opens, gives what was waiting, and hands the game over to whatever comes next
 * within the same set of moves, so no player is ever left looking at it. It exists because everything a square
 * gives on its own is given by moves, and those moves would otherwise be played before the question they come
 * after was even asked: "Spy, then draw 1 card" would draw the card its owner is about to look at.
 *
 * What is left is read like any other set of effects, so it may ask something in turn, and what it asks is
 * answered before whatever was interrupted, exactly as the first half of the card was (see {@link resolveEffects}).
 */
export class PendingEffectsRule extends EffectRule {
  onRuleStart(): Move[] {
    const pending = pendingEffects(this)[0]
    forgetPendingEffects(this)
    if (pending === undefined) return this.resume()
    return [...resolveEffects(this, pending.effects, pending.source), ...this.resume()]
  }
}
