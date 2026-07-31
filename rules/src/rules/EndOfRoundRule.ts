import { MaterialMove, MaterialRulesPart } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The round is over: the player who was not the active one becomes the active player, and reveals the next
 * Action tile.
 *
 * TODO: phase 3, the organisation, is played by both players before this.
 * TODO: once the 4th Action tile has been revealed, the 5 of them are shuffled back into a face down pile, and
 * the player who controls the fewest Victory symbols becomes the active player instead.
 */
export class EndOfRoundRule extends MaterialRulesPart<number, MaterialType, LocationType> {
  onRuleStart(): Move[] {
    const roundPlayer = this.remind<number>(Memory.RoundPlayer)
    const opponent = this.game.players.find((player) => player !== roundPlayer) ?? roundPlayer
    return [this.startPlayerTurn(RuleId.ChooseAction, opponent)]
  }
}
