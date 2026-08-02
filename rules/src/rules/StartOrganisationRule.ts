import { MaterialMove, MaterialRulesPart } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * Phase 3 of a round, the organisation: both players organise their grid, the active player of the round first.
 *
 * Nobody is asked anything here, so this rule has no player of its own: it only hands the turn to the first of
 * the two, which is exactly what the phase 2 rules cannot do. The Military Victory token of the conflict may open
 * a rule of its own, played by whoever won it, and a rule that resumes keeps the player it was resumed by
 * (see {@link EffectRule}): that player is not always the one who organises first.
 */
export class StartOrganisationRule extends MaterialRulesPart<number, MaterialType, LocationType> {
  onRuleStart(): MaterialMove<number, MaterialType, LocationType>[] {
    return [this.startPlayerTurn(RuleId.Organisation, this.remind<number>(Memory.RoundPlayer))]
  }
}
