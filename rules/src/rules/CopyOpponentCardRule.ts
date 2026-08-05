import { CustomMove, isCustomMoveType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { sameCell } from '../material/PlayerGrid'
import { copiableCells } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'
import { cardEffectsOn } from './playedCards'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Cat card reads as "copy the effect of a card your opponent can activate this turn": the squares of the
 * zone of the round in their opponent's grid, whether that opponent has resolved them yet or not.
 *
 * What is copied is what the card gives, read on their grid and against their square: a Shark card surrounded by
 * their tokens gives its Pack effect here too, and a Cat card gives whichever of its 2 effects is up over there.
 * Everything it gives is copied, the half turn of a Cat card included: their card is turned over by being copied,
 * exactly as activating it would have turned it (see {@link Effect.HalfTurn}).
 *
 * Nothing else of theirs is spent, and nothing else lands on their side: the copy is resolved for the player
 * holding this card, in their own grid.
 */
export class CopyOpponentCardRule extends EffectRule {
  /** An opponent with no card of their own in the zone leaves nothing to copy, and the effect is lost. */
  onRuleStart(): Move[] {
    return this.cells.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.cells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  get opponent(): number {
    return this.nextPlayer
  }

  /** The squares of the zone that hold a card of the opponent with something to give (see {@link copiableCells}). */
  get cells(): XYCoordinates[] {
    return copiableCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined || !this.cells.some((copiable) => sameCell(copiable, cell))) return []
    const effects = cardEffectsOn(this, this.opponent, cell)
    if (effects === undefined) return []
    /**
     * The square handed to the effects is the one the card stands on in the opponent's grid, and it is handed over
     * as theirs: that is where the card is read, a Shark card counting the tokens around it counting theirs, and
     * that is where it is turned, a Cat card copied taking its half turn on their side of the table
     * (see {@link Effect.HalfTurn}). Everything else is gained by the player copying it, in their own grid.
     */
    return [...resolveEffects(this, effects, { cell, owner: this.opponent }), ...this.resume()]
  }
}
