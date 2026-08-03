import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { Effect, Effects } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { EffectRule } from './EffectRule'
import { resolveEffects } from './effects'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Military Victory token gives beyond the Victory symbols printed on it, in the lexicon every effect of the
 * game shares. Victory and DoubleVictory are worth their symbols and nothing else, hence nothing here.
 */
const militaryVictoryEffects: Partial<Record<MilitaryVictoryTokenId, Effects>> = {
  [MilitaryVictoryTokenId.Spy]: { [Effect.Spy]: 1 },
  [MilitaryVictoryTokenId.FlipDesert]: { [Effect.Flip]: 1 },
  [MilitaryVictoryTokenId.Upgrade]: { [Effect.Upgrade]: 1 },
  [MilitaryVictoryTokenId.Food]: { [Effect.Food]: 1 },
  [MilitaryVictoryTokenId.StealFood]: { [Effect.StealFood]: 1 },
  [MilitaryVictoryTokenId.Draw]: { [Effect.Draw]: 1 }
}

/**
 * A player takes the first Military Victory token and resolves it. Winning the military conflict is what usually
 * brings a player here, and the Panda King brings them here in the middle of their activation, which is why this
 * is a rule of its own rather than a part of the conflict.
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
