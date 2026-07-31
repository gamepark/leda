import { Material, XYCoordinates } from '@gamepark/rules-api'
import { ActionTileId } from './ActionTileId'
import { LocationType } from './LocationType'
import { MaterialType } from './MaterialType'

/**
 * The zones of 4 squares an Action tile may designate. Rows and columns are numbered like the rulebook does,
 * from 1, while the coordinates of a grid start at 0.
 */
export enum ActionZone {
  Row1 = 1,
  Row2,
  Row3,
  Row4,
  Column1,
  Column2,
  Column3,
  Column4,
  TopLeftSquare,
  TopRightSquare,
  BottomLeftSquare,
  BottomRightSquare,
  Corners,
  Center
}

const row = (y: number): XYCoordinates[] => [0, 1, 2, 3].map((x) => ({ x, y }))
const column = (x: number): XYCoordinates[] => [0, 1, 2, 3].map((y) => ({ x, y }))
const square = (x: number, y: number): XYCoordinates[] => [
  { x, y },
  { x: x + 1, y },
  { x, y: y + 1 },
  { x: x + 1, y: y + 1 }
]

/** The 4 squares of each zone, as coordinates of a player's grid. */
export const actionZoneCells: Record<ActionZone, XYCoordinates[]> = {
  [ActionZone.Row1]: row(0),
  [ActionZone.Row2]: row(1),
  [ActionZone.Row3]: row(2),
  [ActionZone.Row4]: row(3),
  [ActionZone.Column1]: column(0),
  [ActionZone.Column2]: column(1),
  [ActionZone.Column3]: column(2),
  [ActionZone.Column4]: column(3),
  [ActionZone.TopLeftSquare]: square(0, 0),
  [ActionZone.TopRightSquare]: square(2, 0),
  [ActionZone.BottomLeftSquare]: square(0, 2),
  [ActionZone.BottomRightSquare]: square(2, 2),
  [ActionZone.Corners]: [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 0, y: 3 },
    { x: 3, y: 3 }
  ],
  [ActionZone.Center]: square(1, 1)
}

/**
 * What each Action tile offers. Tiles 1 to 4 share one index between their row, their column and their square:
 * tile 3 offers row 3, column 3, and the square of the 3rd corner in reading order.
 */
export const actionTileZones: Record<ActionTileId, ActionZone[]> = {
  [ActionTileId.TopLeft]: [ActionZone.Row1, ActionZone.Column1, ActionZone.TopLeftSquare],
  [ActionTileId.TopRight]: [ActionZone.Row2, ActionZone.Column2, ActionZone.TopRightSquare],
  [ActionTileId.BottomLeft]: [ActionZone.Row3, ActionZone.Column3, ActionZone.BottomLeftSquare],
  [ActionTileId.BottomRight]: [ActionZone.Row4, ActionZone.Column4, ActionZone.BottomRightSquare],
  [ActionTileId.CornersOrCenter]: [ActionZone.Corners, ActionZone.Center]
}

/** Whether a zone covers a given square of a grid. */
export const zoneContains = (zone: ActionZone, cell: XYCoordinates): boolean =>
  actionZoneCells[zone].some((zoneCell) => zoneCell.x === cell.x && zoneCell.y === cell.y)

/**
 * The Action tile of the current round: the last one turned face up, which the location strategy numbered highest.
 * Takes the Material so that both the rules and the app can call it on their own instance.
 */
export const revealedActionTile = (actionTiles: Material<number, MaterialType, LocationType>): ActionTileId | undefined =>
  actionTiles
    .location(LocationType.ActionTileRevealed)
    .sort((tile) => -tile.location.x!)
    .getItem<ActionTileId>()?.id
