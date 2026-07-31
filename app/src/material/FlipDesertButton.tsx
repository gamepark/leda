import { faRotate } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { flippableDeserts } from '@gamepark/leda/rules/tileChoices'
import { LedaMenuButton } from './LedaMenuButton'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The Flip a Military Victory token gave: every Desert of the player carries the button that turns it back onto
 * its front. Which tiles those are comes from the same helper the rules use to know what is legal.
 */
export const FlipDesertButton = ({ index, rules, player }: TileButtonProps) => {
  const desert = flippableDeserts(rules, player).index(index)
  if (!desert.exists) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={desert.moveItem((tile) => ({ ...tile.location, rotation: false }))}>
      <FontAwesomeIcon icon={faRotate} />
    </LedaMenuButton>
  )
}
