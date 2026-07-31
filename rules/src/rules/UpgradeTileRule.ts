import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { upgradableTiles } from './tileChoices'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * An Upgrade effect: the player turns one of their permanent tiles over, onto the stronger face it will show on
 * every later activation. A tile they activated gives it, and so does a Military Victory token.
 *
 * When it interrupts an activation the player does not change, so this rule and the one that opened it hand each
 * other back and forth with startRule: what is left of the zone to activate is untouched while this lasts.
 */
export class UpgradeTileRule extends EffectRule {
  /** An Upgrade is lost if there is nothing left to upgrade: every permanent tile already shows its best face. */
  onRuleStart(): Move[] {
    return this.upgradableTiles.length > 0 ? [] : this.resume()
  }

  getPlayerMoves() {
    return this.upgradableTiles.moveItems((tile) => ({ ...tile.location, rotation: true }))
  }

  get upgradableTiles() {
    return upgradableTiles(this, this.player)
  }

  /** Upgrading is the whole of this rule: the player moves on as soon as a tile is turned over. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    return this.resume()
  }
}
