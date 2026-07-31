import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { upgradableTiles } from '@gamepark/leda/rules/tileChoices'
import { LedaMenuButton } from './LedaMenuButton'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The Upgrade an activated square gave: every permanent tile still on its front carries the button that turns it
 * over. Which tiles those are comes from the same helper the rules use to know what is legal.
 */
export const UpgradeTileButton = ({ index, rules, player }: TileButtonProps) => {
  const tile = upgradableTiles(rules, player).index(index)
  if (!tile.exists) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={tile.moveItem((tile) => ({ ...tile.location, rotation: true }))}>
      <FontAwesomeIcon icon={faArrowUp} />
    </LedaMenuButton>
  )
}
