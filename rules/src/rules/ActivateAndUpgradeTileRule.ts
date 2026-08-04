import { MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { ActivateTileRule } from './ActivateTileRule'
import { upgradableTiles } from './tileChoices'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Shark card reads as "activate one of your tiles, then upgrade it, if possible": the activation a Cat card
 * asks for on its own (see {@link ActivateTileRule}), with the upgrade added on top.
 *
 * The tile activated is the one upgraded, which only a permanent one still on its front can be, hence the "if
 * possible". A temporary tile turns into a Desert as it is activated, like everywhere else, and cannot be upgraded
 * at all: the player is still free to pick one, and simply loses the second half of what the card gives.
 */
export class ActivateAndUpgradeTileRule extends ActivateTileRule {
  /** The tile just activated, turned onto its upgraded face when it has one it is not showing yet. */
  afterActivate(index: number): Move[] {
    const tile = upgradableTiles(this, this.player).index(index)
    return tile.exists ? [tile.moveItem((item) => ({ ...item.location, rotation: true }))] : []
  }
}
