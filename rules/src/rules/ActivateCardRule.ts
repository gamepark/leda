import { CustomMove, isCustomMoveType, MaterialMove } from '@gamepark/rules-api'
import { ClanCardItemId } from '../material/ClanCardId'
import { clanCardEffects } from '../material/clanCards/cardProperties'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'
import { activableCards } from './playedCards'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What the Panda Queen reads: "activate one of your Panda cards in play". The card picked gives what it gives, as
 * if the square it sits on had been activated, and what it asks the player is asked before the Queen hands the
 * game back (see {@link resolveEffects}).
 *
 * Which cards may be picked is read off the grid rather than from anything the Queen carries, so any card of any
 * clan giving the same effect would work the same (see {@link activableCards}).
 */
export class ActivateCardRule extends EffectRule {
  /** A player whose only card in play is the Queen herself has nothing to activate with her. */
  onRuleStart(): Move[] {
    return this.cards.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.cards.getIndexes().map((index) => this.customMove(CustomMoveType.ActivateCard, index))
  }

  get cards() {
    return activableCards(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, number>(CustomMoveType.ActivateCard)(move)) return []
    if (move.data === undefined) return []
    const front = this.material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.data).id?.front
    if (front === undefined) return []
    return [...resolveEffects(this, clanCardEffects(front)), ...this.resume()]
  }
}
