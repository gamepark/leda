import { css } from '@emotion/react'
import { ActionZone } from '@gamepark/leda/material/ActionZone'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { LocationDescription, MaterialContext } from '@gamepark/react-game'
import { Location } from '@gamepark/rules-api'
import { offeredZones, zoneColor, zoneInset, zoneLine, zoneRectangleAt } from './actionZones'
import { gridGap, tileSize } from './TileDescription'

/**
 * One of the rectangles a zone the Action tile of the round offers is drawn as (see {@link zoneRectangles}).
 * The 2 or 3 zones of a tile are drawn at once, each in its own color, and the button of each is on one of the
 * squares only that zone covers (see {@link ChooseZoneButton}): the rectangles are what the player reads, and the
 * buttons are what they press.
 *
 * Nothing is clickable here: a location with no help and no move of its own lets the pointer through, so the
 * squares underneath keep their own clicks, their help dialogs included.
 */
export class ActionZoneDescription extends LocationDescription<number, MaterialType, LocationType, ActionZone> {
  /** As round as the squares it is drawn around. */
  borderRadius = 0.5

  /**
   * A rectangle covers whole squares, half a gap outside of them on every side, so that it falls in the middle of
   * the gap between them and the squares next to them. Then it is pulled in by the inset of its zone, which is
   * what keeps the zones of one tile apart (see {@link zoneInset}).
   */
  getLocationSize(location: Location<number, LocationType>, context: MaterialContext<number, MaterialType, LocationType>) {
    const zone = location.id as ActionZone
    const rectangle = zoneRectangleAt(zone, cellOf(location))
    if (rectangle === undefined) return { width: 0, height: 0 }
    const inset = 2 * zoneInset(offeredZones(context.rules), zone)
    return { width: rectangle.width * (tileSize + gridGap) - inset, height: rectangle.height * (tileSize + gridGap) - inset }
  }

  getExtraCss(location: Location<number, LocationType>, context: MaterialContext<number, MaterialType, LocationType>) {
    const zones = offeredZones(context.rules)
    const zone = location.id as ActionZone
    return zoneRectangle(zoneColor(zones, zone), zoneLine(zones, zone))
  }
}

/**
 * The border is drawn inside the size above rather than around it, hence the box sizing: the rectangle has to
 * land on the squares it was measured from, and not half a border further out.
 * Nothing is cast under it: an outer shadow is the shadow of the whole box and not of the line drawn on it, so a
 * broken line would come with a continuous halo, and the very thing telling 2 zones apart would be filled back in.
 */
const zoneRectangle = (color: string, line: string) => css`
  box-sizing: border-box;
  border: 0.22em ${line} ${color};
`
