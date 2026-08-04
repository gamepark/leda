import { faFish } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { sharkSupply, tilesWithoutSharkToken } from '@gamepark/leda/rules/sharkPack'
import { LedaMenuButton } from './LedaMenuButton'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * A Shark card asking for a token to be placed: every tile of the player that has none carries the button that
 * puts one there. Which tiles those are comes from the same helper the rules use to know what is legal.
 */
export const PlaceSharkTokenButton = ({ index, rules, player }: TileButtonProps) => {
  if (!tilesWithoutSharkToken(rules, player).index(index).exists) return null
  const supply = sharkSupply(rules, player)
  if (supply.getQuantity() === 0) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={supply.moveItems({ type: LocationType.PlacedSharkToken, player, parent: index }, 1)[0]}>
      <FontAwesomeIcon icon={faFish} />
    </LedaMenuButton>
  )
}
