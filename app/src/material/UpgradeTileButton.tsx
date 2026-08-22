import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaMenuButton } from './LedaMenuButton'
import { offeredTileMove } from './menuButtons'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The Upgrade an activated square gave: every permanent tile still on its front carries the button that turns it
 * over, which is the very move the rules are offering on it (see {@link offeredTileMove}).
 */
export const UpgradeTileButton = ({ index, rules, player }: TileButtonProps) => {
  const move = offeredTileMove(rules, player, index)
  if (move === undefined) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={move}>
      <FontAwesomeIcon icon={faArrowUp} />
    </LedaMenuButton>
  )
}
