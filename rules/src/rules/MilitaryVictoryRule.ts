import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { militaryVictoryEffects, MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * A player takes the first Military Victory token and resolves it. Winning the military conflict is what usually
 * brings a player here, and a Panda or Shark card brings them here in the middle of their activation, which is
 * why this is a rule of its own rather than a part of the conflict.
 */
export class MilitaryVictoryRule extends EffectRule {
  /** The token is drawn face down, so what it gives can only be read once the move that reveals it is played. */
  onRuleStart(): Move[] {
    if (!this.deck.length) return this.resume()
    return this.deck.limit(1).moveItems({ type: LocationType.PlayerMilitaryVictory, player: this.player })
  }

  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.MilitaryVictoryToken)(move)) return []
    if (move.location.type !== LocationType.PlayerMilitaryVictory) return []
    const token = this.material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(move.itemIndex)
    return [...resolveEffects(this, militaryVictoryEffects[token.id] ?? {}), ...this.resume()]
  }

  /** deck() draws from the highest x, which is the top of the pile the DeckLocator stacks. */
  get deck() {
    return this.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck).deck()
  }
}
