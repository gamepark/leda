import { CustomMove, isCustomMoveType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { sameCell, tileAt } from '../material/PlayerGrid'
import { activateTile } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { bareCells, upgradableTiles } from './tileChoices'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Shark card reads as "activate one of your tiles, then upgrade it, if possible": a square of the grid is
 * activated out of turn, and outside the zone of the round.
 *
 * The tile is what gives, not the card played on it: the rulebook tells "activating a tile" and "activating a clan
 * card" apart, and this card says tile. A tile a card covers is therefore out of reach, card and tile being one
 * square and only one of them ever being on top of it.
 *
 * The tile activated is the one upgraded, which only a permanent one still on its front can be, hence the "if
 * possible". A temporary tile turns into a Desert as it is activated, like everywhere else, and cannot be
 * upgraded at all.
 */
export class ActivateAndUpgradeTileRule extends EffectRule {
  /** A grid whose every square is covered leaves nothing to activate, and the effect is lost. */
  onRuleStart(): Move[] {
    return this.cells.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.cells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  /**
   * The bare squares of the grid: a Desert may be picked, to be turned over by the upgrade that follows, but a
   * square holding a card may not, its tile being under that card (see {@link bareCells}).
   */
  get cells(): XYCoordinates[] {
    return bareCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined || !this.cells.some((activable) => sameCell(activable, cell))) return []
    const [tile] = tileAt(this.material(MaterialType.Tile), this.player, cell).getIndexes()
    if (tile === undefined) return []
    return [...activateTile(this, tile), ...this.upgrade(tile), ...this.resume()]
  }

  /** The tile just activated, turned onto its upgraded face when it has one it is not showing yet. */
  upgrade(index: number): Move[] {
    const tile = upgradableTiles(this, this.player).index(index)
    return tile.exists ? [tile.moveItem((item) => ({ ...item.location, rotation: true }))] : []
  }
}
