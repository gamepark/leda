import { CustomMove, isCustomMoveType, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { militaryVictoryEffects, MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'
import { ownedMilitaryVictoryTokens } from './militaryConflict'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Shark card reads as "trigger the effect of one of your Military Victory tokens": a token already won
 * gives what it gave once more, and stays where it is.
 *
 * The tokens worth nothing but their Victory symbols are left out: picking one would be picking nothing.
 */
export class TriggerMilitaryVictoryRule extends EffectRule {
  onRuleStart(): Move[] {
    return this.tokens.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.tokens.getIndexes().map((index) => this.customMove(CustomMoveType.TriggerMilitaryVictory, index))
  }

  get tokens() {
    return ownedMilitaryVictoryTokens(this, this.player).id<MilitaryVictoryTokenId>((id) => militaryVictoryEffects[id] !== undefined)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, number>(CustomMoveType.TriggerMilitaryVictory)(move)) return []
    if (move.data === undefined) return []
    const token = this.material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(move.data)
    if (token.location.type !== LocationType.PlayerMilitaryVictory || token.location.player !== this.player) return []
    return [...resolveEffects(this, militaryVictoryEffects[token.id] ?? {}), ...this.resume()]
  }
}
