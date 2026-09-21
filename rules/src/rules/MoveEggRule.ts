import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf } from '../material/PlayerGrid'
import { EffectRule } from './EffectRule'
import { playedEggs } from './snake'
import { isGridSettled, swapBackMove, swapMoves } from './swap'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Snake card reads as "move one of your Eggs": its owner swaps the square of one of the Eggs they have in
 * play with any other square of their own grid, exactly as an organisation swaps 2 squares (see {@link swap}). The
 * Egg follows its tile, like every card played on a square, and whatever stood on the other square takes its place.
 *
 * Which Egg is moved stays a secret: the card never moves on its own, so their opponent sees 2 squares change
 * places and learns nothing more than they already knew (see {@link snake}).
 */
export class MoveEggRule extends EffectRule {
  /** A player whose Eggs have all hatched, or lie under another card, has none to move. */
  onRuleStart(): Move[] {
    return this.eggTiles.length > 0 ? [] : this.resume()
  }

  /** The swaps of the grid that take the square of an Egg somewhere else. */
  getPlayerMoves(): Move[] {
    const eggTiles = this.eggTiles
    return swapMoves(this, this.player).filter((move) => isMoveItemType(MaterialType.Tile)(move) && eggTiles.includes(move.itemIndex))
  }

  /** The tiles the Eggs of the player are laid on, which is what a swap moves them with. */
  get eggTiles(): number[] {
    return playedEggs(this, this.player)
      .getItems()
      .flatMap((card) => (card.location.parent === undefined ? [] : [card.location.parent]))
  }

  /** The other half of the swap, read while the state still says which tile was where. */
  beforeItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    const back = swapBackMove(this, this.player, move.itemIndex, cellOf(move.location))
    return back === undefined ? [] : [back]
  }

  /** Only the second half of the swap ends the effect, the first one leaving 2 tiles on one square. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    return isGridSettled(this, this.player) ? this.resume() : []
  }
}
