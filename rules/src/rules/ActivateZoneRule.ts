import { CustomMove, isCustomMoveType, MaterialMove, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { tileAt } from '../material/PlayerGrid'
import { activableCells, activateCard, activateTile, afterActivation, ActivationChoice, zoneCandidateCells } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { queueLast, startNextRule } from './effects'
import { Memory } from './Memory'
import { cardEffectsOn } from './playedCards'
import { canPlaceRing } from './rings'
import { RuleId } from './RuleId'
import { awakenings } from './specialActivation'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * Phase 1 of a round, once the zone is known: the player activates each square of that zone in their own grid,
 * if possible and in the order of their choice. The active player of the round goes first, then their opponent
 * starts the same rule over on their own grid.
 */
export class ActivateZoneRule extends PlayerTurnRule<number, MaterialType, LocationType> implements ActivationChoice {
  /**
   * A zone can hold nothing to activate at all, 4 Deserts for instance, in which case the player is skipped on
   * the spot: a rule that offers no move would leave the game waiting for a player with nothing to play.
   * This also runs when an effect that opened a rule of its own hands the player back, hence nothing reset here:
   * what they already activated is remembered per player, and emptied when the round starts.
   */
  onRuleStart(): Move[] {
    return this.nextStep()
  }

  getPlayerMoves() {
    return this.activableCells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  get activableCells(): XYCoordinates[] {
    return activableCells(this, this.player)
  }

  /** The same squares before the once-per-phase rule narrows them, which is what the table locks (see {@link ActivationChoice}). */
  get candidateCells(): XYCoordinates[] {
    return zoneCandidateCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined) return []
    // Remembered before the effects are resolved, so that what is left to activate is read against this square done.
    this.memorize<XYCoordinates[]>(Memory.ActivatedCells, (cells) => [...cells, cell], this.player)
    const moves = this.activate(cell)
    // What the square asked the player is answered first, and this rule is what takes over once it all is. It takes
    // over the same way when the square asked nothing: what it gave is given by moves that are played after this
    // one, so a step read here would be read on a game the activation has not happened in yet, and the deck the
    // Blue Ring asks to be empty would still hold the card the square has just drawn (see {@link nextStep}).
    queueLast(this, RuleId.ActivateZone)
    return [...moves, ...startNextRule(this)]
  }

  /**
   * Everything a square gives, which is what the card played on it gives, or what its tile gives when no card
   * covers it (see {@link cardEffectsOn}).
   * A temporary tile is turned into a Desert once it has given what it gives, and a Cat card takes a half turn
   * onto its other effect: every other card stays exactly as it was, and gives the same thing every time.
   */
  activate(cell: XYCoordinates): Move[] {
    if (cardEffectsOn(this, this.player, cell) !== undefined) return activateCard(this, cell)
    const [tile] = tileAt(this.material(MaterialType.Tile), this.player, cell).getIndexes()
    return tile === undefined ? [] : activateTile(this, tile)
  }

  /**
   * Nothing happens until the player has activated everything they could. Then comes what their clan does once the
   * zone is done, which the rulebook puts after all the other activations: the Awakenings the Pandas gathered
   * along the way, or the Rings the Cats may put in play (see {@link AwakeningRule} and {@link PlaceRingRule}).
   * Both hand the game over on their own once they are resolved, and no player is ever offered the two: a player
   * has one clan, and the Awakenings of the other one are never theirs to gather.
   */
  nextStep(): Move[] {
    if (this.activableCells.length > 0) return []
    if (awakenings(this, this.player) > 0) return [this.startRule(RuleId.Awakening)]
    if (canPlaceRing(this, this.player)) return [this.startRule(RuleId.PlaceRing)]
    return afterActivation(this)
  }
}
