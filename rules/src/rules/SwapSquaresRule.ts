import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf } from '../material/PlayerGrid'
import { EffectRule } from './EffectRule'
import { isGridSettled, swapBackMove, swapMoves } from './swap'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Scorpion Portal reads as "swap the position of 2 of your cards or tiles": the very swap an organisation
 * offers, in the middle of the activation and for free (see {@link swap}).
 *
 * A grid always holds 16 tiles, so there is always a swap to make: unlike every other effect that asks something,
 * this one can never be lost for want of anything to pick.
 */
export class SwapSquaresRule extends EffectRule {
  getPlayerMoves(): Move[] {
    return swapMoves(this, this.player)
  }

  /** The other half of the swap, read while the state still says which tile was where. */
  beforeItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    const back = swapBackMove(this, this.player, move.itemIndex, cellOf(move.location))
    return back === undefined ? [] : [back]
  }

  /**
   * Both halves of the swap are tile moves, and only the second one ends the effect: the first leaves 2 tiles on
   * one square, and the game is not to be handed over in the middle of that (see {@link isGridSettled}).
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    return isGridSettled(this, this.player) ? this.resume() : []
  }
}
