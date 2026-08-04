import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { Effect } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'
import { ownedMilitaryVictoryTokens } from './militaryConflict'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Shark card reads as "put one of your Military Victory tokens back under the pile, then draw a new one and
 * resolve its effect": a token whose effect was of no use is traded for whatever comes next.
 *
 * Under the pile and not on top of it, so that the token put back is not the one drawn again: x 0 is what pushes
 * a whole pile up one, exactly as putting a spied item back under it does (see {@link putBackMoves}).
 */
export class RedrawMilitaryVictoryRule extends EffectRule {
  /** A player who has won no token yet has none to trade, and the draw is not theirs to make either. */
  onRuleStart(): Move[] {
    return this.tokens.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.tokens.moveItems({ type: LocationType.MilitaryVictoryDeck, x: 0 })
  }

  get tokens() {
    return ownedMilitaryVictoryTokens(this, this.player)
  }

  /** The token is back under the pile: what follows is a draw, which is a rule of its own. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.MilitaryVictoryToken)(move)) return []
    if (move.location.type !== LocationType.MilitaryVictoryDeck) return []
    return [...resolveEffects(this, { [Effect.MilitaryVictory]: 1 }), ...this.resume()]
  }
}
