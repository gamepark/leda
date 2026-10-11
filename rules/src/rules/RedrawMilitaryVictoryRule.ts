import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { Effect } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { militaryVictoryEffects, MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
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
  isPossible(): boolean {
    return this.tokens.length > 0
  }

  getPlayerMoves(): Move[] {
    return this.tokens.moveItems({ type: LocationType.MilitaryVictoryDeck, x: 0 })
  }

  get tokens() {
    return ownedMilitaryVictoryTokens(this, this.player)
  }

  /**
   * The token is back under the pile, and the top one takes its place, which is then resolved.
   *
   * Drawn here rather than by {@link MilitaryVictoryRule}: a token traded is not a token won, so a round a Scorpion
   * Portal closed to Military Victory tokens still lets the Sharks trade one (see {@link Effect.BlockMilitaryVictory}).
   * Nor is it the conflict of the round, whose Rings that rule opens a window for. There is always a token to draw,
   * the one just put back being one.
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.MilitaryVictoryToken)(move)) return []
    if (move.location.type === LocationType.MilitaryVictoryDeck) {
      return this.deck.limit(1).moveItems({ type: LocationType.PlayerMilitaryVictory, player: this.player })
    }
    if (move.location.type !== LocationType.PlayerMilitaryVictory) return []
    const token = this.material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(move.itemIndex)
    return [...resolveEffects(this, militaryVictoryEffects[token.id] ?? {}), ...this.resume()]
  }

  /** deck() draws from the highest x, which is the top of the pile the DeckLocator stacks. */
  get deck() {
    return this.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck).deck()
  }
}
