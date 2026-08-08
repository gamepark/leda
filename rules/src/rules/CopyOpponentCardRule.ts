import { CustomMove, isCustomMoveType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { sameCell } from '../material/PlayerGrid'
import { copiableCells, squareEffects } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Cat card reads as "copy the effect of a square your opponent can activate this turn": the squares of the
 * zone of the round in their opponent's grid, whether that opponent has resolved them yet or not.
 *
 * A square is what is copied, and not only a card: a bare square of theirs gives its tile, exactly as it would
 * give it to them (see {@link squareEffects}). Which face of it is up is read over there, on their grid: a Shark
 * card surrounded by their tokens gives its Pack effect and not its printed one.
 *
 * What that square gives is then given to the card that copied it, and given exactly as if it had been printed on
 * it in the place of the copy: the Cat card resolves those effects, on its own side of the table and for its own
 * owner, and takes the half turn it prints once everything is resolved, as it would have on any other face
 * (see {@link Effect.HalfTurn}). So the card that reads "1 Food per pair of your Deserts" copied by a Cat gives
 * the Deserts of the Cat, and the card that reads its own square gives what that square is worth here: nothing at
 * all, the only such card counting Shark tokens, which a Cat never owns (see {@link EffectSource}).
 *
 * Nothing of theirs is spent and nothing lands on their side, their square staying exactly as it stands: a
 * temporary tile of theirs does not become the Desert activating it would have made of it, becoming one being
 * what it costs its owner to activate it and not what it gives (see {@link activateTile}). Their card is not
 * turned over either, and no copy ever turns one: the 2 players hold 2 different clans (see {@link ChooseClanRule}),
 * so the only clan whose cards take a half turn is the one holding this card, never the one it copies.
 */
export class CopyOpponentCardRule extends EffectRule {
  /** An opponent with nothing of their own to activate in the zone leaves nothing to copy, and the effect is lost. */
  onRuleStart(): Move[] {
    return this.cells.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.cells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  get opponent(): number {
    return this.nextPlayer
  }

  /** The squares of the zone the opponent has something to give on (see {@link copiableCells}). */
  get cells(): XYCoordinates[] {
    return copiableCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined || !this.cells.some((copiable) => sameCell(copiable, cell))) return []
    const effects = squareEffects(this, this.opponent, cell)
    if (effects === undefined) return []
    /**
     * Nothing is handed to the effects as what gives them, unlike every other activation: what was read is a
     * square of the opponent, and what resolves it is the card that copied it, so neither of the two is what these
     * effects are read against (see {@link EffectSource}). Nothing is lost by that: what such an effect reads is
     * the Shark tokens around itself, and there are none around a Cat card to read.
     * The card that copied still takes the half turn it prints, that half turn being its own and not part of what
     * it copies (see {@link activateCard}).
     */
    return [...resolveEffects(this, effects), ...this.resume()]
  }
}
