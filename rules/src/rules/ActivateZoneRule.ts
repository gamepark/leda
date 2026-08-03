import { CustomMove, isCustomMoveType, MaterialMove, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { tileAt } from '../material/PlayerGrid'
import { isPermanent, tileEffects } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { activableCells, afterActivation } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { pendingRules, queueLast, resolveEffects, startNextRule } from './effects'
import { Memory } from './Memory'
import { cardEffectsOn } from './playedCards'
import { RuleId } from './RuleId'
import { awakenings } from './specialActivation'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * Phase 1 of a round, once the zone is known: the player activates each square of that zone in their own grid,
 * if possible and in the order of their choice. The active player of the round goes first, then their opponent
 * starts the same rule over on their own grid.
 */
export class ActivateZoneRule extends PlayerTurnRule<number, MaterialType, LocationType> {
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

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined) return []
    // Remembered before the effects are resolved, so that what is left to activate is read against this square done.
    this.memorize<XYCoordinates[]>(Memory.ActivatedCells, (cells) => [...cells, cell], this.player)
    const moves = this.activate(cell)
    // What the square asked the player is answered first, and this rule is what takes over once it all is.
    if (pendingRules(this).length === 0) return [...moves, ...this.nextStep()]
    queueLast(this, RuleId.ActivateZone)
    return [...moves, ...startNextRule(this)]
  }

  /**
   * Everything a square gives, which is what the card played on it gives, or what its tile gives when no card
   * covers it (see {@link cardEffectsOn}).
   * A temporary tile is turned into a Desert once it has given what it gives. A card is not: it stays face up on
   * its square and gives the same thing every time that square is activated.
   */
  activate(cell: XYCoordinates): Move[] {
    const card = cardEffectsOn(this, this.player, cell)
    if (card !== undefined) return resolveEffects(this, card)
    const tile = this.tileOn(cell)
    const item = tile.getItem<TileId>()
    if (item === undefined) return []
    const moves = resolveEffects(this, tileEffects(item.id, item.location.rotation === true))
    if (item.location.rotation !== true && !isPermanent(item.id)) moves.push(tile.moveItem({ ...item.location, rotation: true }))
    return moves
  }

  /** The tile on a square of the grid of the player who is activating. */
  tileOn(cell: XYCoordinates) {
    return tileAt(this.material(MaterialType.Tile), this.player, cell)
  }

  /**
   * Nothing happens until the player has activated everything they could. Then come the Awakenings they gathered
   * along the way, which the rulebook puts after all the other activations, and which hand the game over on their
   * own once they are all resolved (see {@link AwakeningRule}).
   */
  nextStep(): Move[] {
    if (this.activableCells.length > 0) return []
    if (awakenings(this, this.player) > 0) return [this.startRule(RuleId.Awakening)]
    return afterActivation(this)
  }
}
