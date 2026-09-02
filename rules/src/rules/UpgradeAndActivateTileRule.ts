import { isMoveItemType, ItemMove, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf } from '../material/PlayerGrid'
import { activateTile, ActivationChoice } from './activation'
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
 * whose permanent tiles are all upgraded or covered loses the whole effect, not just its second half.
 *
 * The one thing "if possible" leaves out is a tile that has already given this phase: upgrading it is still worth
 * doing, and is still offered, but nothing gives twice in one activation and the second half is lost
 * (see {@link activateTile}). The one rule of the game that offers a square the table marks with a lock, since
 * what it is offering is the upgrade and not the activation (see {@link lockedCells}).
 */
export class UpgradeAndActivateTileRule extends EffectRule implements ActivationChoice {
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

  /**
   * The squares those tiles stand on, which are the squares this rule would activate (see {@link ActivationChoice}).
   * The one rule whose {@link candidateCells} are not narrowed down anywhere: what it offers is the upgrade, and
   * an upgrade is not an activation. So a tile already activated keeps its move and takes a lock beside it, which
   * is the table saying that the half behind the upgrade is the half being lost (see {@link lockedCells}).
   */
  get candidateCells(): XYCoordinates[] {
    return this.tiles.getItems().map((tile) => cellOf(tile.location))
  }

  /** The tile is activated once it is upgraded, so that it gives what its upgraded face gives. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    return [...activateTile(this, move.itemIndex), ...this.resume()]
  }
}
