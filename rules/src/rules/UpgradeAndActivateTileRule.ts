import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { activateTile } from './activation'
import { EffectRule } from './EffectRule'
import { upgradableTiles } from './tileChoices'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Scorpion card reads as "upgrade one of your tiles, then activate it if possible": the reverse of what a
 * Shark card offers (see {@link ActivateAndUpgradeTileRule}), and worth more for it, since what is activated is
 * the upgraded face rather than the one the tile was showing.
 *
 * The tile is picked once, for both halves: it is the tile just upgraded that is activated, never another one.
 * Only a bare permanent tile still on its front can be upgraded at all (see {@link upgradableTiles}), so a player
 * whose permanent tiles are all upgraded or covered loses the whole effect, not just its second half. What is left
 * to pick is a tile nothing covers, which is a tile there is nothing to stop from being activated once it is
 * turned over: "if possible" is about the upgrade, and the activation follows it every time.
 */
export class UpgradeAndActivateTileRule extends EffectRule {
  /** Nothing left to upgrade leaves nothing to do, and the effect is lost. */
  onRuleStart(): Move[] {
    return this.tiles.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.tiles.moveItems((tile) => ({ ...tile.location, rotation: true }))
  }

  get tiles() {
    return upgradableTiles(this, this.player)
  }

  /** The tile is activated once it is upgraded, so that it gives what its upgraded face gives. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    return [...activateTile(this, move.itemIndex), ...this.resume()]
  }
}
