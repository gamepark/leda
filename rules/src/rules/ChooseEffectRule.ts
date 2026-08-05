import { CustomMove, isCustomMoveType, MaterialMove } from '@gamepark/rules-api'
import { EffectChoice, Effects } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { forgetChoice, pendingChoices, resolveEffects } from './effects'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * An "OR": the player resolves one branch of what an effect offers, and only one. Any clan may write one, on a
 * card or on its Victory condition card, hence a rule of its own rather than one per clan: what the branches are
 * travels with the choice (see {@link Memory.EffectChoices}), and this asks which one and resolves it.
 */
export class ChooseEffectRule extends EffectRule {
  /** A choice with nothing to choose from would leave the game waiting for a player with no move. */
  onRuleStart(): Move[] {
    return this.branches.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.branches.map((_, branch) => this.customMove(CustomMoveType.ChooseEffect, branch))
  }

  /** The choice being made, which is the first one waiting. */
  get choice(): EffectChoice | undefined {
    return pendingChoices(this)[0]
  }

  /** The branches it offers. */
  get branches(): Effects[] {
    return this.choice?.or ?? []
  }

  /**
   * The branch picked is resolved like anything else, so it may ask the player something in turn, and what it
   * asks is answered before whatever this choice interrupted (see {@link resolveEffects}).
   * It is read against what the choice was reached from, which the choice carries for that: a branch is part of
   * what a square gives, and it is read on that square like the rest of it (see {@link EffectSource}).
   */
  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, number>(CustomMoveType.ChooseEffect)(move)) return []
    const choice = this.choice
    const branch = move.data !== undefined ? this.branches[move.data] : undefined
    if (choice === undefined || branch === undefined) return []
    forgetChoice(this)
    return [...resolveEffects(this, branch, { cell: choice.cell, from: choice.from, owner: choice.owner }), ...this.resume()]
  }
}
