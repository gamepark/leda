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
  resume(): MaterialMove<number, MaterialType, LocationType>[] {
    return startNextRule(this)
  }
}
