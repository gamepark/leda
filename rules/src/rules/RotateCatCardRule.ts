import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { rotatableCells, rotateCatCard } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The one effect the 4 Rings give: "you may Rotate one of your Cat cards". The card turns half a turn onto its
 * other effect, without being activated and without giving anything.
 *
 * That is what a Cat player buys with a Ring: their cards alternate between 2 effects as they are activated, and
 * half of those cards have nothing at all on their second face. Turning one back by hand is how a player lines up
 * the face they want for the round to come, instead of taking whatever the alternation left them.
 *
 * Their own to refuse, hence the pass: a card already showing the face its owner wants is better left alone.
 */
export class RotateCatCardRule extends EffectRule {
  /** A player with no Cat card worth turning has nothing to do, and the effect is lost rather than refused. */
  onRuleStart(): Move[] {
    return this.cells.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return [...this.cells.map((cell) => this.customMove(CustomMoveType.RotateCatCard, cell)), this.customMove(CustomMoveType.Pass, this.player)]
  }

  /** The squares whose top card is a Cat card with 2 effects to alternate between (see {@link rotatableCells}). */
  get cells(): XYCoordinates[] {
    return rotatableCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.Pass)(move)) return this.resume()
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.RotateCatCard)(move)) return []
    const cell = move.data
    if (cell === undefined || !this.cells.some((rotatable) => rotatable.x === cell.x && rotatable.y === cell.y)) return []
    return rotateCatCard(this, this.player, cell)
  }

  /** The half turn is the whole of the effect: the game moves on as soon as the card has taken it. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    return isMoveItemType(MaterialType.ClanCard)(move) ? this.resume() : []
  }
}
