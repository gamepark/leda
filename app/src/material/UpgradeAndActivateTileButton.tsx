import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { upgradableTiles } from '@gamepark/leda/rules/tileChoices'
import { LedaMenuButton } from './LedaMenuButton'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * A Scorpion card upgrading a tile and activating it right after: every permanent tile still on its front carries
 * the button, the tile upgraded being the one activated (see {@link UpgradeAndActivateTileRule}).
 * The same move as a plain Upgrade, since what follows it is the rule's business and not the player's.
 */
export const UpgradeAndActivateTileButton = ({ index, rules, player }: TileButtonProps) => {
  const tile = upgradableTiles(rules, player).index(index)
  if (!tile.exists) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={tile.moveItem((tile) => ({ ...tile.location, rotation: true }))}>
      <FontAwesomeIcon icon={faArrowUp} />
    </LedaMenuButton>
  )
}
