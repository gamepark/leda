import { MaterialMove, MaterialRulesPart } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { canWinMilitaryVictory, queueLast } from './effects'
import { conflictWinner } from './militaryConflict'
import { RuleId } from './RuleId'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * Phase 2 of a round: the players compare the military symbols they gathered while activating the zone, and the
 * one who has the most takes the top Military Victory token, reveals it, and resolves its effect.
 *
 * Nobody is asked anything to get there, so this rule has no player of its own: it reads who won and hands the
 * turn over to them. Drawing the token and resolving it is a rule of its own, since a Panda card draws one too
 * (see {@link MilitaryVictoryRule}).
 *
 * What is queued behind it is the organisation rather than the turn of a player: whoever won the token is not
 * always the one who organises first (see {@link StartOrganisationRule}).
 */
export class MilitaryConflictRule extends MaterialRulesPart<number, MaterialType, LocationType> {
  /** A Scorpion Portal may have closed the round to Military Victory tokens, and then nobody wins the conflict. */
  onRuleStart(): Move[] {
    const winner = conflictWinner(this)
    if (winner === undefined || !this.deck.length || !canWinMilitaryVictory(this)) return [this.startRule(RuleId.StartOrganisation)]
    queueLast(this, RuleId.StartOrganisation)
    return [this.startPlayerTurn(RuleId.MilitaryVictory, winner)]
  }

  get deck() {
    return this.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck).deck()
  }
}
