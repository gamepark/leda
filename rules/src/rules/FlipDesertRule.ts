import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { visibleDeserts } from './tileChoices'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * A Flip effect: the player turns one of their Deserts back onto its front, which makes that temporary tile
 * activable again. Only a Military Victory token gives it for now.
 */
export class FlipDesertRule extends EffectRule {
  /** "If possible": a player whose temporary tiles all show their front, or lie under a card, has no Desert to turn back. */
  onRuleStart(): Move[] {
    return this.deserts.length > 0 ? [] : this.resume()
  }

  getPlayerMoves() {
    return this.deserts.moveItems((desert) => ({ ...desert.location, rotation: false }))
  }

  get deserts() {
    return visibleDeserts(this, this.player)
  }

  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    return this.resume()
  }
}
