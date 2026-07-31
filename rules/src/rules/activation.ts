import { MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { ActionZone, actionZoneCells } from '../material/ActionZone'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { gridTiles, sameCell, tileAt } from '../material/PlayerGrid'
import { hasTileEffect, isPermanent } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * What a player may still do while the zone is being activated. The app reads it to know which squares and tiles
 * to offer, and the rules of the phase to know which moves are legal, so that the two can never disagree.
 */

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

/** The zone of the round: the one the active player picked on the Action tile. */
export const roundZone = (rules: Rules): ActionZone | undefined => rules.game.memory[Memory.ActionZone]

/** Whether the zone is being activated, the rules an effect opens along the way included. */
export const isActivationPhase = (rules: Rules): boolean => {
  const rule = rules.game.rule?.id
  return rule === RuleId.ActivateZone || rule === RuleId.UpgradeTile
}

/** The squares of the zone a player has already resolved this round. */
const activatedCells = (rules: Rules, player: number): XYCoordinates[] => rules.game.memory[Memory.ActivatedCells]?.[player] ?? []

/**
 * The squares of the zone a player has left to activate in their grid. A square with nothing to resolve is left
 * out rather than skipped by hand: the rulebook has the player activate each square of the zone "if possible",
 * and a Desert is exactly the square that is not possible.
 */
export const activableCells = (rules: Rules, player: number): XYCoordinates[] => {
  const zone = roundZone(rules)
  if (zone === undefined) return []
  const activated = activatedCells(rules, player)
  return actionZoneCells[zone].filter((cell) => !activated.some((done) => sameCell(done, cell)) && isActivable(rules, player, cell))
}

/** Whether a square holds anything to resolve. Only the tile for now: clan cards are not played on the grid yet. */
const isActivable = (rules: Rules, player: number, cell: XYCoordinates): boolean => {
  const tile = tileAt(rules.material(MaterialType.Tile), player, cell).getItem<TileId>()
  return tile !== undefined && hasTileEffect(tile.id, tile.location.rotation === true)
}

/** What an Upgrade effect may turn over: the permanent tiles of the player that still show their front. */
export const upgradableTiles = (rules: Rules, player: number) => {
  const tiles = gridTiles(rules.material(MaterialType.Tile), player)
  return tiles.id<TileId>(isPermanent).rotation<boolean | undefined>((rotation) => rotation !== true)
}
