import { MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { startNextRule } from './effects'

/**
 * A rule an effect opens to ask the player something, whether that effect comes from a tile they activated, from
 * a Military Victory token, or from a clan card.
 *
 * Such a rule never knows what follows it: it hands the game over to whatever is waiting next, which is the rest
 * of what the same effects asked for, and then whatever was interrupted to ask (see {@link Memory.NextRules}).
 */
export abstract class EffectRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  /** An effect with nothing to act on is lost: the game moves on without asking anything (see {@link isPossible}). */
  onRuleStart(): MaterialMove<number, MaterialType, LocationType>[] {
    return this.isPossible() ? [] : this.resume()
  }

  /**
   * Whether the effect has anything to act on for its player: a Desert to turn back, a tile to upgrade, a card to
   * activate. Asked when the rule starts, and asked too of the effects a Cat card may copy, before it is offered to
   * copy them: a copy that would give nothing is not one (see {@link givesAnything}).
   * A new effect rule says here when it is lost, and both questions are answered at once.
   */
  isPossible(): boolean {
    return true
  }

  resume(): MaterialMove<number, MaterialType, LocationType>[] {
    return startNextRule(this)
  }
}
