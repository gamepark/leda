import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { actionTileZones, ActionZone, actionZoneCells, zoneContains } from '@gamepark/leda/material/ActionZone'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { Rules } from '@gamepark/leda/Rules'
import { getEnumValues, XYCoordinates } from '@gamepark/rules-api'

/**
 * How likely each square of a grid is to be activated in the rounds to come, read off the Action tiles that are
 * still face down. Nothing secret is read here: the revealed tiles lie face up between the players, so what is
 * left in the pile is public, and only the order of it is not.
 *
 * This is what the AI organises its grid against: a square worth something is worth having where the tiles are
 * likely to point (see {@link swapValue}), and a card is worth playing where it will actually be activated
 * (see {@link playCardValue}).
 */

const allActionTiles = getEnumValues(ActionTileId) as ActionTileId[]

/**
 * The Action tiles the players may still turn up.
 *
 * Only 4 of the 5 are revealed per cycle, so a pile down to its last tile is a pile that will be shuffled back
 * whole before anything else comes out of it: what is coming is then the 5 tiles again, and no square is any more
 * likely than another one to be pointed at. That is exactly the moment moving a good square around stops being
 * worth 1 Food, and it falls out of here rather than being a rule of its own.
 */
export const comingActionTiles = (rules: Rules): ActionTileId[] => {
  const revealed = new Set(
    rules
      .material(MaterialType.ActionTile)
      .location(LocationType.ActionTileRevealed)
      .getItems<ActionTileId>()
      .map((tile) => tile.id)
  )
  const left = allActionTiles.filter((tile) => !revealed.has(tile))
  return left.length > 1 ? left : allActionTiles
}

/**
 * The odds that a square is part of the zone of one of the rounds to come: over the tiles still to be revealed,
 * how often that square is covered by a zone they offer.
 *
 * The zones of a tile are counted as equally likely, which they are not: the active player picks the one that
 * suits them. Reading who that player will be, and what they would pick with a grid that will have changed by
 * then, is a game the AI has no business playing 4 rounds ahead. What matters here is that the middle squares
 * come up more often than the ones only one tile ever reaches, and that survives the approximation.
 */
export const cellLikelihood = (tiles: ActionTileId[], cell: XYCoordinates): number => {
  if (tiles.length === 0) return 0
  const covered = tiles.reduce((odds, tile) => {
    const zones = actionTileZones[tile]
    return odds + zones.filter((zone) => zoneContains(zone, cell)).length / zones.length
  }, 0)
  return covered / tiles.length
}

/** The squares of a zone, which the AI scores one by one on each grid (see {@link zoneAdvantage}). */
export const zoneCells = (zone: ActionZone): XYCoordinates[] => actionZoneCells[zone]
