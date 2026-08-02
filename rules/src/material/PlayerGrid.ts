import { Location, Material, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from './LocationType'
import { MaterialType } from './MaterialType'

/**
 * The 4x4 grid of a player, whose squares are addressed by the x and y of a location, both in 0..3.
 * The helpers below take the Material rather than the rules, so that the rules and the app can each call them
 * on their own instance.
 */

export const sameCell = (a: XYCoordinates, b: XYCoordinates): boolean => a.x === b.x && a.y === b.y

/** The square a location stands on. Partial, so that the location a move is heading to can be read the same way. */
export const cellOf = (location: Partial<Location>): XYCoordinates => ({ x: location.x!, y: location.y! })

/** The 16 tiles of a player's grid. */
export const gridTiles = (tiles: Material<number, MaterialType, LocationType>, player: number) => tiles.location(LocationType.PlayerGrid).player(player)

/** The tile on one square of a player's grid. */
export const tileAt = (tiles: Material<number, MaterialType, LocationType>, player: number, cell: XYCoordinates) =>
  gridTiles(tiles, player).location((location) => location.x === cell.x && location.y === cell.y)
