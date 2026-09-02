import { CustomMove, isCustomMoveType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { sameCell, tileAt } from '../material/PlayerGrid'
import { activateTile, ActivationChoice, stillActivable } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { bareCells } from './tileChoices'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Cat card reads as "activate one of your tiles, upgraded or not": a square of the grid is activated out of
 * turn, and outside the zone of the round.
 *
 * The tile is what gives, not the card played on it: the rulebook tells "activating a tile" and "activating a clan
 * card" apart, and this card says tile. A tile a card covers is therefore out of reach, card and tile being one
 * square and only one of them ever being on top of it.
 *
 * Nothing else happens to the tile, beyond what activating it does anywhere else: a temporary one becomes a Desert
 * as it gives what it gives, as everywhere. The Shark card that upgrades it afterwards adds that half on top
 * (see {@link ActivateAndUpgradeTileRule}).
 */
export class ActivateTileRule extends EffectRule implements ActivationChoice {
  /** A grid whose every square is covered leaves nothing to activate, and the effect is lost. */
  onRuleStart(): Move[] {
    return this.cells.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.cells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  /**
   * The bare squares of the grid: a Desert may be picked, which gives nothing on its own but is what the upgrade
   * of a Shark card is after, and a square holding a card may not, its tile being under that card.
   *
   * Minus the tiles already activated this phase, which no card may have give twice
   * (see {@link stillActivable}). A grid left with nothing to pick loses the effect, exactly as a grid whose
   * every square is covered does.
   */
  get cells(): XYCoordinates[] {
    return stillActivable(this, this.player, this.candidateCells)
  }

  /** The same squares before the once-per-phase rule narrows them, which is what the table locks (see {@link ActivationChoice}). */
  get candidateCells(): XYCoordinates[] {
    return bareCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined || !this.cells.some((activable) => sameCell(activable, cell))) return []
    const [tile] = tileAt(this.material(MaterialType.Tile), this.player, cell).getIndexes()
    if (tile === undefined) return []
    return [...activateTile(this, tile), ...this.afterActivate(tile), ...this.resume()]
  }

  /** What the rule does to the tile once it has been activated, which for this one is nothing at all. */
  afterActivate(_index: number): Move[] {
    return []
  }
}
