import { MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { afterOrganisation } from './organisation'

/**
 * Still phase 3: a player is done organising their grid. Their opponent organises their own, and once both have,
 * the round is over.
 *
 * Nothing is asked here, and the player of the rule is only the one who has just finished: a rule that is started
 * keeps the player it was started by, which is exactly what this needs to know whose organisation ended
 * (see {@link afterOrganisation}).
 *
 * A step of its own so that the end of an organisation is something that can be waited for: a card paid with
 * cards from the hand is paid for after it has been played, and what follows that payment is this
 * (see {@link PayCardCostRule}).
 */
export class EndOfOrganisationRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  onRuleStart(): MaterialMove<number, MaterialType, LocationType>[] {
    return afterOrganisation(this)
  }
}
