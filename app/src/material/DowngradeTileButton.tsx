import { faArrowDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TileId } from '@gamepark/leda/material/TileId'
import { downgradableTiles, worseFace } from '@gamepark/leda/rules/tileChoices'
import { LedaMenuButton } from './LedaMenuButton'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * Every tile of the player that is not on its worse face yet carries the button that turns it over: the upgrade of
 * a permanent tile is lost, a temporary one becomes a Desert (see {@link downgradableTiles}).
 *
 * The player pressing it is turning their own tile over, on their own grid, like every other tile button. What
 * asks it of them is a Scorpion Portal their opponent played, and that is the only thing "opponent" ever names
 * here: nothing on this side of the table belongs to anybody else (see {@link DowngradeTileRule}).
 */
export const DowngradeTileButton = ({ index, rules, player }: TileButtonProps) => {
  const tile = downgradableTiles(rules, player).index(index)
  const item = tile.getItem<TileId>()
  if (item === undefined) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={tile.moveItem((tile) => ({ ...tile.location, rotation: worseFace(item.id!) }))}>
      <FontAwesomeIcon icon={faArrowDown} />
    </LedaMenuButton>
  )
}
