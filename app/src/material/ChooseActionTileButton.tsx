import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { useAnimation } from '@gamepark/react-game'
import { MaterialMoveBuilder, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { offeredZones, zoneChosenOn, zoneColor } from './actionZones'
import { LedaMenuButton } from './LedaMenuButton'
import { TileButtonProps } from './TileMenuButton'
import { ZoneIcon } from './ZoneIcon'

/**
 * The button that picks a zone, on the one square of that zone no other zone of the tile covers
 * (see {@link zoneButtonCell}). There is nothing to validate afterwards: a zone is picked as a block, so pressing
 * the button is the move.
 * The zone it stands for is drawn inside it, which is what says which of the 3 rectangles the button belongs to,
 * and its rim is the color that rectangle is drawn in.
 */
export const ChooseZoneButton = ({ rules, cell }: { rules: MaterialRules<number, MaterialType, LocationType>; cell: XYCoordinates }) => {
  // Nothing is read off the Action tile while the table is still moving (see {@link ActionZoneComponent}).
  const animation = useAnimation()
  const zones = offeredZones(rules)
  const zone = zoneChosenOn(zones, cell)
  if (animation !== undefined || zone === undefined) return null
  return (
    <LedaMenuButton
      {...zoneButtonPosition}
      size={zoneButtonSize}
      accent={zoneColor(zones, zone)}
      move={MaterialMoveBuilder.customMove(CustomMoveType.ChooseAction, zone)}
    >
      <ZoneIcon zone={zone} size={zoneIconSize} />
    </LedaMenuButton>
  )
}

/**
 * Wider than the other medallions of the table, because what it shows is a grid of 16 squares and not one symbol,
 * and moved back towards the middle of its tile so that it stays inside it at that size: it covers the top left
 * quarter of the square and leaves the bottom of the artwork, where the symbols of the tile are read.
 */
const zoneButtonSize = 3.4
const zoneIconSize = 2.1
const zoneButtonPosition = { x: -1.5, y: -1.5 }

/** The button on a bare square of the player's own grid. A card played over it carries the same one. */
export const ChooseActionTileButton = ({ index, rules }: TileButtonProps) => (
  <ChooseZoneButton rules={rules} cell={cellOf(rules.material(MaterialType.Tile).getItem(index).location)} />
)
