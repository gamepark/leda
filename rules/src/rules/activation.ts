import { MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { ActionZone, actionZoneCells } from '../material/ActionZone'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { sameCell, tileAt } from '../material/PlayerGrid'
import { hasTileEffect } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { Memory } from './Memory'

/**
 * What the player who is activating may still do. The app reads it to know which squares to offer, and
 * {@link ActivateZoneRule} to know which moves are legal, so that the two can never disagree.
 */

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

/** The zone of the round: the one the active player picked on the Action tile. */
export const roundZone = (rules: Rules): ActionZone | undefined => rules.game.memory[Memory.ActionZone]

/** The squares of the zone the player who is activating has already resolved. */
const activatedCells = (rules: Rules): XYCoordinates[] => rules.game.memory[Memory.ActivatedCells] ?? []

/**
 * The squares of the zone a player has left to activate in their grid. A square with nothing to resolve is left
 * out rather than skipped by hand: the rulebook has the player activate each square of the zone "if possible",
 * and a Desert is exactly the square that is not possible.
 */
export const activableCells = (rules: Rules, player: number): XYCoordinates[] => {
  const zone = roundZone(rules)
  if (zone === undefined) return []
  const activated = activatedCells(rules)
  return actionZoneCells[zone].filter((cell) => !activated.some((done) => sameCell(done, cell)) && isActivable(rules, player, cell))
}

/** Whether a square holds anything to resolve. Only the tile for now: clan cards are not played on the grid yet. */
const isActivable = (rules: Rules, player: number, cell: XYCoordinates): boolean => {
  const tile = tileAt(rules.material(MaterialType.Tile), player, cell).getItem<TileId>()
  return tile !== undefined && hasTileEffect(tile.id, tile.location.rotation === true)
}
