import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove, MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { afterActivation } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { startNextRule } from './effects'
import { isMilitaryConflictPhase } from './militaryConflict'
import { ringMoves } from './rings'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The window a player of the Cats puts their Rings in play in: the Rings they hold whose condition is met, on any
 * square of their own grid, for free (see {@link rings}).
 *
 * It opens where the Pandas resolve their Awakenings, once the player is done activating their zone, and once more
 * the moment a conflict is won, which is the only place the Red Ring can be played
 * (see {@link ActivateZoneRule} and {@link MilitaryVictoryRule}).
 *
 * Free is not compulsory, hence the pass: a Ring put in play is a Ring that can be buried under a later card, and
 * one kept in hand is a Ring that can be traded for a Military Victory token (see {@link SpendRingForTokenRule}).
 * As many as the conditions allow, one after the other: nothing in the rules stops at the first.
 */
export class PlaceRingRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  /** Nothing to put in play leaves nothing to ask, and turning down what cannot be done is not a decision. */
  onRuleStart(): Move[] {
    return this.ringMoves.length > 0 ? [] : this.close()
  }

  getPlayerMoves(): Move[] {
    return [...this.ringMoves, this.customMove(CustomMoveType.Pass, this.player)]
  }

  get ringMoves(): Move[] {
    return ringMoves(this, this.player)
  }

  /**
   * A Ring in play may leave another one playable, so the window stays open until the player has none left or
   * passes. Staying in the rule is enough: what it offers is read again from a grid that now holds the Ring.
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.type !== LocationType.PlayedCard) return []
    return this.ringMoves.length > 0 ? [] : this.close()
  }

  onCustomMove(move: CustomMove): Move[] {
    return isCustomMoveType(CustomMoveType.Pass)(move) ? this.close() : []
  }

  /**
   * What follows the window, which is whatever it interrupted: the rest of the round waits behind the conflict
   * one, where the token that was won still has its questions to ask and the organisation is queued behind them.
   * The window of the activation interrupts nothing and has nothing waiting, so it hands the game over the way
   * being done activating always does (see {@link afterActivation}).
   */
  close(): Move[] {
    return isMilitaryConflictPhase(this) ? startNextRule(this) : afterActivation(this)
  }
}
