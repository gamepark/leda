import { CustomMove, isCustomMoveType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { ClanCardItemId } from '../material/ClanCardId'
import { clanCardEffects } from '../material/clanCards/cardProperties'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { sameCell } from '../material/PlayerGrid'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'
import { copiableSnakes } from './playedCards'
import { cellsOf } from './snake'
import { topCardIndexOn } from './squares'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Snake card reads as "copy the effect of one of your Snakes": what that Snake gives is given all over
 * again, and the Snake itself is left exactly as it stands.
 *
 * Copied and not activated, which is the whole difference: the Snake read is not written down as having given
 * anything, so its own activation of the round is still ahead of it, and a Snake that has already been through
 * the zone may be read here all the same (see {@link CopyOpponentCardRule}, which copies the same way across the
 * table). What is activated is the card that copies, and it was activated the moment its square was.
 *
 * Its Hatching effect is not part of what is copied: that one is given the round the Egg opens and never again,
 * and this card is not opening anything (see {@link ClanCardProperties.secondEffects}).
 *
 * The player names the square rather than the card, like everywhere else (see {@link CustomMoveType.ActivateSquare}).
 */
export class CopySnakeRule extends EffectRule {
  /** A player whose only Snake in play is the one asking has nothing to copy with it (see {@link copiableSnakes}). */
  onRuleStart(): Move[] {
    return this.cells.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.cells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  get cells(): XYCoordinates[] {
    return cellsOf(this, copiableSnakes(this, this.player))
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined || !this.cells.some((copiable) => sameCell(copiable, cell))) return []
    const index = topCardIndexOn(this, this.player, cell)
    const front = index === undefined ? undefined : this.material(MaterialType.ClanCard).getItem<ClanCardItemId>(index).id?.front
    if (front === undefined) return []
    /**
     * Nothing is handed to the effects as what gives them, exactly as nothing is when a Cat card copies across the
     * table: what was read is one card and what resolves it is another, so neither of the 2 is what these effects
     * are read against (see {@link EffectSource}). Nothing is lost by that: what a Snake reads is how many Snakes
     * its owner has in play, and that is the same number on either card.
     */
    return [...resolveEffects(this, clanCardEffects(front)), ...this.resume()]
  }
}
