import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaMenuButton } from './LedaMenuButton'
import { offeredTileMove } from './menuButtons'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * A Scorpion card upgrading a tile and activating it right after: every permanent tile still on its front carries
 * the button, the tile upgraded being the one activated (see {@link UpgradeAndActivateTileRule}).
 * The same move as a plain Upgrade, since what follows it is the rule's business and not the player's, and read
 * off the rules the same way (see {@link offeredTileMove}).
 */
export const UpgradeAndActivateTileButton = ({ index, rules, player }: TileButtonProps) => {
  const move = offeredTileMove(rules, player, index)
  if (move === undefined) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={move}>
      <FontAwesomeIcon icon={faArrowUp} />
    </LedaMenuButton>
  )
}
