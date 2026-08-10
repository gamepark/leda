import { LocationDescription, useAnimation } from '@gamepark/react-game'
import { ComponentProps } from 'react'

/**
 * What the framework draws a location with, taken off a bare description since it is not exported on its own:
 * a rectangle needs its size, its place and its border, which is the whole of it.
 */
const LocationComponent = new LocationDescription().Component

/**
 * One of the rectangles a zone of the Action tile is drawn as (see {@link ActionZoneDescription}), and nothing at
 * all while anything on the table is still moving.
 *
 * A move only reaches the table once it has finished animating: at the start of a round the last Action tile
 * revealed is still the one of the round before, and its own zones would be drawn over the grids for as long as
 * the tile of the new round takes to be turned over. Nothing is read off a tile while the table is moving, so the
 * rectangles come up with the tile they belong to (see {@link ChooseZoneButton} for the buttons they carry).
 */
export const ActionZoneComponent = (props: ComponentProps<typeof LocationComponent>) => {
  const animation = useAnimation()
  if (animation !== undefined) return null
  return <LocationComponent {...props} />
}
