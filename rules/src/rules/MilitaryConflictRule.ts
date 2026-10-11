import { MaterialMove, MaterialRulesPart } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { canWinMilitaryVictory, queueLast } from './effects'
import { Memory } from './Memory'
import { conflictWinner } from './militaryConflict'
import { canPlaceRing } from './rings'
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
  /**
   * A Scorpion Portal may have closed the round to Military Victory tokens: "no player may win a Military Victory
   * token this round", which takes the token away and leaves the conflict alone. It is still fought and still won,
   * so the Red Ring of the Cats, which asks for a conflict won and not for a token, is still offered to its winner
   * (see {@link ringPlacements}).
   */
  onRuleStart(): Move[] {
    // The activation has played out all its rules. Emptied for a game rebuilt from older moves (see ChooseActionRule).
    this.memorize(Memory.NextRules, undefined)
    const winner = conflictWinner(this)
    if (winner === undefined) return [this.startRule(RuleId.StartOrganisation)]
    if (!canWinMilitaryVictory(this)) {
      if (!canPlaceRing(this, winner)) return [this.startRule(RuleId.StartOrganisation)]
      queueLast(this, RuleId.StartOrganisation)
      return [this.startPlayerTurn(RuleId.PlaceRing, winner)]
    }
    if (!this.deck.length) return [this.startRule(RuleId.StartOrganisation)]
    queueLast(this, RuleId.StartOrganisation)
    return [this.startPlayerTurn(RuleId.MilitaryVictory, winner)]
  }

  get deck() {
    return this.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck).deck()
  }
}
