import { CustomMove, isCustomMoveType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, sameCell } from '../material/PlayerGrid'
import { activateCard, ActivationChoice, stillActivable } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { activableCards } from './playedCards'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What the Panda Queen reads: "activate one of your Panda cards in play". The card picked gives what it gives, as
 * if the square it sits on had been activated, and what it asks the player is asked before the Queen hands the
 * game back (see {@link resolveEffects}).
 *
 * The player names the square rather than the card, like everywhere else, a card being the only thing a square
 * ever holds twice (see {@link CustomMoveType.ActivateSquare}). Which cards may be picked is read off the grid
 * rather than from anything the Queen carries, so any card of any clan giving the same effect would work the same
 * (see {@link activableCards}).
 */
export class ActivateCardRule extends EffectRule implements ActivationChoice {
  /** A player whose only card in play is the Queen herself has nothing to activate with her. */
  onRuleStart(): Move[] {
    return this.cells.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.cells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  /**
   * The squares of the cards that may be activated, which is where their tile stands, minus the cards that have
   * already given what they give this phase (see {@link stillActivable}): the Queen is played to activate a card
   * a second time in the round, and never the same card twice.
   */
  get cells(): XYCoordinates[] {
    return stillActivable(this, this.player, this.candidateCells)
  }

  /** The same squares before the once-per-phase rule narrows them, which is what the table locks (see {@link ActivationChoice}). */
  get candidateCells(): XYCoordinates[] {
    const tiles = this.material(MaterialType.Tile)
    return activableCards(this, this.player)
      .getItems()
      .map((card) => cellOf(tiles.getItem(card.location.parent!).location))
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined || !this.cells.some((activable) => sameCell(activable, cell))) return []
    // Activated exactly as its own square would be, half turn of a Cat card included (see {@link activateCard}).
    return [...activateCard(this, cell), ...this.resume()]
  }
}
