import { MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * A rule an effect opens to ask the player something, whether that effect comes from a tile they activated, from
 * a Military Victory token, or from a clan card.
 *
 * Whoever opens one writes down what takes over afterwards in {@link Memory.NextRule}: the rule that was
 * interrupted, or what comes after the one that opened the choice. {@link resume} hands the game over to it and
 * forgets it, so that the memory holds a rule only while there is one waiting.
 */
export abstract class EffectRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  resume(): MaterialMove<number, MaterialType, LocationType>[] {
    const next = this.remind<RuleId>(Memory.NextRule)
    this.forget(Memory.NextRule)
    return [this.startRule(next)]
  }
}
