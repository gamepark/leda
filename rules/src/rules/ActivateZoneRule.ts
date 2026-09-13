import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove, MaterialMove, MoveItem, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, tileAt } from '../material/PlayerGrid'
import {
  activableCells,
  activateCard,
  activateTile,
  afterActivation,
  ActivationChoice,
  hatchableCells,
  hatchedCard,
  hatchMoves,
  zoneCandidateCells
} from './activation'
import { CustomMoveType } from './CustomMoveType'
import { queueLast, startNextRule } from './effects'
import { Memory } from './Memory'
import { cardEffectsOn } from './playedCards'
import { canPlaceRing } from './rings'
import { RuleId } from './RuleId'
import { isSnakeCard } from './snake'
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

  /**
   * The squares of the zone, and the Eggs of a Snake their owner may pay to hatch, which is the one thing of this
   * phase a player is offered rather than owed. So there is a way of turning those down and none of turning the
   * others down: the pass is only there once everything that had to be activated has been (see {@link nextStep}).
   */
  getPlayerMoves(): Move[] {
    const activable = this.activableCells
    const hatchable = this.hatchableCells
    return [
      ...activable.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell)),
      ...hatchable.map((cell) => this.customMove(CustomMoveType.HatchEgg, cell)),
      ...(activable.length === 0 && hatchable.length > 0 ? [this.customMove(CustomMoveType.Pass)] : [])
    ]
  }

  get activableCells(): XYCoordinates[] {
    return activableCells(this, this.player)
  }

  /** The Eggs of the zone their owner can pay to hatch, which is nothing at all for every other clan. */
  get hatchableCells(): XYCoordinates[] {
    return hatchableCells(this, this.player)
  }

  /** The same squares before the once-per-phase rule narrows them, which is what the table locks (see {@link ActivationChoice}). */
  get candidateCells(): XYCoordinates[] {
    return zoneCandidateCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    /**
     * Hatching is paid for and turns the card over, and nothing else happens here: what the Snake gives is given
     * once it is on its Snake side, on the move that turns it (see {@link afterItemMove}).
     */
    if (isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.HatchEgg)(move)) {
      return move.data === undefined ? [] : hatchMoves(this, move.data)
    }
    // Turning down what is left to hatch is being done with the phase, and the only way a player ever ends one.
    if (isCustomMoveType(CustomMoveType.Pass)(move)) return this.afterZone()
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
   * An Egg that has just hatched: the square it stands on is activated on the spot, its Hatching effect first
   * (see {@link hatchedCard}). Read on the move that turns the card rather than on the one that paid for it, so
   * that a Snake counting the Snakes in play, itself included, is read on a table where it is already one.
   *
   * Only a Snake turned onto its Snake side: a Cat card takes the same half turn as a consequence of the very
   * activation this rule asked for, and it is not being hatched (see {@link Effect.HalfTurn}).
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.ClanCard)(move) || !this.isHatching(move)) return []
    const tile = this.material(MaterialType.ClanCard).getItem(move.itemIndex).location.parent
    if (tile === undefined) return []
    const cell = cellOf(this.material(MaterialType.Tile).getItem(tile).location)
    // Remembered before the effects are resolved, exactly as it is for a square the player activates.
    this.memorize<XYCoordinates[]>(Memory.ActivatedCells, (cells) => [...cells, cell], this.player)
    const moves = hatchedCard(this, cell)
    queueLast(this, RuleId.ActivateZone)
    return [...moves, ...startNextRule(this)]
  }

  isHatching(move: MoveItem<number, MaterialType, LocationType>): boolean {
    if (move.location.type !== LocationType.PlayedCard || move.location.rotation !== true) return false
    return isSnakeCard(this.material(MaterialType.ClanCard).getItem(move.itemIndex))
  }

  /**
   * Nothing happens until the player has activated everything they could, and nothing either while they still
   * have an Egg they may pay to hatch: that one is theirs to turn down, and the pass is what they turn it down
   * with (see {@link getPlayerMoves}).
   */
  nextStep(): Move[] {
    if (this.activableCells.length > 0 || this.hatchableCells.length > 0) return []
    return this.afterZone()
  }

  /**
   * What their clan does once the zone is done, which the rulebook puts after all the other activations: the
   * Awakenings the Pandas gathered along the way, or the Rings the Cats may put in play
   * (see {@link AwakeningRule} and {@link PlaceRingRule}).
   * Both hand the game over on their own once they are resolved, and no player is ever offered the two: a player
   * has one clan, and the Awakenings of the other one are never theirs to gather.
   */
  afterZone(): Move[] {
    if (awakenings(this, this.player) > 0) return [this.startRule(RuleId.Awakening)]
    if (canPlaceRing(this, this.player)) return [this.startRule(RuleId.PlaceRing)]
    return afterActivation(this)
  }
}
