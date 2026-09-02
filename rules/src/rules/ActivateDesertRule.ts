import { CustomMove, isCustomMoveType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { sameCell, tileAt } from '../material/PlayerGrid'
import { tileEffects } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { ActivationChoice, rememberActivated, stillActivable } from './activation'
 import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'
import { visibleDesertCells } from './tileChoices'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Scorpion card reads as "activate the effect reminded on one of your Deserts": a Desert is a temporary
 * tile that has already been activated, and its back reminds what its front gave. This is the one way to read
 * that reminder again.
 *
 * Nothing is turned over: the tile is still a Desert once it has given what it reminds, and the same card may
 * read it again next round. That is what tells this effect from a Flip, which turns a Desert back onto its front
 * and hands it to the ordinary activation of the zone.
 */
export class ActivateDesertRule extends EffectRule implements ActivationChoice {
  /** A player with no Desert at all has nothing to read, and the effect is lost. */
  onRuleStart(): Move[] {
    return this.cells.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.cells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  /**
   * The squares holding a Desert that is on the table. One under a card is out of reach: that card covers the
   * tile of its square, and the reminder printed on it is covered with it (see {@link visibleDesertCells}).
   *
   * Minus the tiles already activated this phase (see {@link stillActivable}), which is what leaves out the very
   * tile that has just become a Desert by being activated: a temporary tile turned over during the zone gives
   * once, and its reminder is for the rounds that come after.
   */
  get cells(): XYCoordinates[] {
    return stillActivable(this, this.player, this.candidateCells)
  }

  /** The same squares before the once-per-phase rule narrows them, which is what the table locks (see {@link ActivationChoice}). */
  get candidateCells(): XYCoordinates[] {
    return visibleDesertCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined || !this.cells.some((desert) => sameCell(desert, cell))) return []
    const desert = tileAt(this.material(MaterialType.Tile), this.player, cell)
    const tile = desert.getItem<TileId>()
    if (tile === undefined) return []
    // The front of the tile, which is what its Desert side reminds, read while the tile keeps showing its back.
    const source = { item: { type: MaterialType.Tile, index: desert.getIndex() } }
    // Written down like every other activation: the reminder of a Desert is that tile giving, and it gives once.
    rememberActivated(this, source.item)
    return [...resolveEffects(this, tileEffects(tile.id, false), source), ...this.resume()]
  }
}
