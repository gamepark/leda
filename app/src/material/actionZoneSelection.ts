import { LedaRules } from '@gamepark/leda/LedaRules'
import { ActionZone, actionTileZones, actionZoneCells, revealedActionTile, zoneContains } from '@gamepark/leda/material/ActionZone'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { Location, MaterialMove, XYCoordinates } from '@gamepark/rules-api'

/**
 * While the active player picks the zone to activate, they select the squares of their grid one by one, and the
 * selection completes itself as soon as a single zone is left to pick.
 * All of it is local and transient: the selection lives in `item.selected` on the client of the active player only,
 * and the rules never hear about it. What they receive is the move validating the zone, and nothing else.
 */

type Move = MaterialMove<number, MaterialType, LocationType>

export const cellOf = (location: Location): XYCoordinates => ({ x: location.x!, y: location.y! })

/** The 16 tiles of a player's grid. Clan cards played on a square are other items: only the tile is selected. */
const gridTiles = (rules: LedaRules, player: number) => rules.material(MaterialType.Tile).location(LocationType.PlayerGrid).player(player)

const tileAt = (rules: LedaRules, player: number, cell: XYCoordinates) =>
  gridTiles(rules, player).location((location) => location.x === cell.x && location.y === cell.y)

/** The squares of their own grid the player has selected so far. */
export const selectedCells = (rules: LedaRules, player: number): XYCoordinates[] =>
  gridTiles(rules, player)
    .selected()
    .getItems()
    .map((item) => cellOf(item.location))

/** The zones the Action tile of the round offers. */
const revealedZones = (rules: LedaRules): ActionZone[] => {
  const tile = revealedActionTile(rules.material(MaterialType.ActionTile))
  return tile !== undefined ? actionTileZones[tile] : []
}

/** The zones the selection may still lead to: the ones that hold every square selected so far. */
const candidateZones = (rules: LedaRules, cells: XYCoordinates[]): ActionZone[] =>
  revealedZones(rules).filter((zone) => cells.every((cell) => zoneContains(zone, cell)))

/**
 * The zone the player has settled on, if any: the single candidate left, which is then entirely selected.
 * This is what the header validates, and nothing can be validated before there is one.
 */
export const selectedZone = (rules: LedaRules, player: number): ActionZone | undefined => {
  const cells = selectedCells(rules, player)
  if (cells.length === 0) return undefined
  const zones = candidateZones(rules, cells)
  return zones.length === 1 ? zones[0] : undefined
}

/** A square can be added to the selection as long as one zone at least holds it along with everything selected. */
export const canSelectCell = (rules: LedaRules, player: number, cell: XYCoordinates): boolean =>
  candidateZones(rules, [...selectedCells(rules, player), cell]).length > 0

/**
 * Selecting a square adds it to the selection, and completes the zone as soon as a single candidate is left.
 * The whole zone is then selected in both grids, since both players are about to activate it in their own.
 */
export const selectCellMoves = (rules: LedaRules, player: number, cell: XYCoordinates): Move[] => {
  const cells = [...selectedCells(rules, player), cell]
  const zones = candidateZones(rules, cells)
  if (zones.length !== 1) return selectCells(rules, player, cells)
  return rules.players.flatMap((grid) => selectCells(rules, grid, actionZoneCells[zones[0]]))
}

const selectCells = (rules: LedaRules, player: number, cells: XYCoordinates[]): Move[] =>
  cells.flatMap((cell) => tileAt(rules, player, cell).selected(false).selectItems())

/** The selection is undone as a whole: a zone is picked as a block, so there is nothing to take back square by square. */
export const clearSelectionMoves = (rules: LedaRules): Move[] => rules.material(MaterialType.Tile).selected().unselectItems()
