import { ActionZone, actionZoneCells, zoneContains } from '@gamepark/leda/material/ActionZone'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { sameCell } from '@gamepark/leda/material/PlayerGrid'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { isCustomMoveType, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { zoneColors } from '../theme'
import { gridGap } from './TileDescription'

/**
 * How the zones the Action tile of the round offers are shown while the active player picks one: each is drawn
 * around the squares it covers, in a color of its own (see {@link ActionZoneDescription}), and one square of each
 * carries the button that picks it (see {@link ChooseZoneButton}).
 *
 * Everything here is read off the moves the rules offer, so the rules hear nothing until a zone is picked: what
 * they receive is the move naming it, and nothing else.
 * The rules are taken as the framework hands them over, since none of this needs more than the material.
 */

type Rules = MaterialRules<number, MaterialType, LocationType>

/**
 * The zones the active player may pick right now, in the order the Action tile of the round lists them.
 *
 * Read off the moves the rules hand that player rather than off the tile they are printed on, so that a rectangle
 * is only ever drawn around squares that pressing it would really activate: none is drawn outside of phase 1, and
 * none is drawn on a tutorial step that is not the one asking for a zone (see {@link LedaTutorial}).
 */
export const offeredZones = (rules: Rules): ActionZone[] => {
  const rule = rules.game.rule
  if (rule?.id !== RuleId.ChooseAction || rule.player === undefined) return []
  return rules
    .getLegalMoves(rule.player)
    .filter(isCustomMoveType<CustomMoveType, ActionZone>(CustomMoveType.ChooseAction))
    .map((move) => move.data)
    .filter((zone) => zone !== undefined)
}

/** The rank of a zone on its tile, which is what its color, its line and its inset are all read from. */
const zoneRank = (zones: ActionZone[], zone: ActionZone): number => Math.max(0, zones.indexOf(zone))

/** The color a zone is drawn in (see {@link zoneColors}). */
export const zoneColor = (zones: ActionZone[], zone: ActionZone): string => zoneColors[zoneRank(zones, zone)]

/**
 * The line a zone is drawn with. The 3 zones of a tile differ by their line as much as by their color, so that
 * telling them apart never depends on reading a color: whichever 2 of them a player cannot tell by hue, one is
 * continuous where the other is broken.
 */
export const zoneLine = (zones: ActionZone[], zone: ActionZone): string => zoneLines[zoneRank(zones, zone)]

const zoneLines = ['solid', 'dashed', 'dotted']

/**
 * The square that carries the button of a zone: the first one in reading order that none of the other zones of the
 * tile covers, so that pressing it can only mean this zone. Every zone of every tile has one, the smallest case
 * being the square of tiles 1 to 4, whose center square is its own (see {@link actionTileZones}).
 */
export const zoneButtonCell = (zones: ActionZone[], zone: ActionZone): XYCoordinates | undefined =>
  actionZoneCells[zone].find((cell) => !zones.some((other) => other !== zone && zoneContains(other, cell)))

/** The zone a square picks, if it is the one carrying the button of a zone. */
export const zoneChosenOn = (zones: ActionZone[], cell: XYCoordinates): ActionZone | undefined =>
  zones.find((zone) => {
    const button = zoneButtonCell(zones, zone)
    return button !== undefined && sameCell(button, cell)
  })

/** A rectangle drawn over a grid, by the square it starts on and how many squares it spans. */
export type ZoneRectangle = { x: number; y: number; width: number; height: number }

/**
 * The rectangles a zone is drawn as: one around the whole zone when its 4 squares form a block, and one around
 * each square when they do not. The 4 corners of tile 5 are the one zone the rulebook offers that is not a block,
 * and a single rectangle around them would be a rectangle around the whole grid.
 */
export const zoneRectangles = (zone: ActionZone): ZoneRectangle[] => {
  const bounds = zoneBounds(zone)
  if (bounds.width * bounds.height === actionZoneCells[zone].length) return [bounds]
  return actionZoneCells[zone].map(({ x, y }) => ({ x, y, width: 1, height: 1 }))
}

/** The rectangle of a zone that starts on a given square, which is what a location of that zone names. */
export const zoneRectangleAt = (zone: ActionZone, cell: XYCoordinates): ZoneRectangle | undefined =>
  zoneRectangles(zone).find((rectangle) => sameCell(rectangle, cell))

/** The squares a zone covers, as the rectangle they form: from (x, y) to (x + width - 1, y + height - 1). */
const zoneBounds = (zone: ActionZone): ZoneRectangle => {
  const cells = actionZoneCells[zone]
  const x = Math.min(...cells.map((cell) => cell.x))
  const y = Math.min(...cells.map((cell) => cell.y))
  return {
    x,
    y,
    width: Math.max(...cells.map((cell) => cell.x)) - x + 1,
    height: Math.max(...cells.map((cell) => cell.y)) - y + 1
  }
}

/**
 * How far inside its squares the rectangles of a zone are drawn, in centimeters. The zones of a tile share their
 * edges - the row, the column and the square of tile 1 all start on the top left square - so each is drawn one
 * step further in than the one listed before it, and the 3 read as 3 rectangles instead of hiding one another.
 */
export const zoneInset = (zones: ActionZone[], zone: ActionZone): number => zoneRank(zones, zone) * zoneInsetStep

/**
 * One step is exactly the gap a grid leaves between 2 squares: the 3 lines stay gathered on the edges of the
 * zone, where they cross as little as possible of the tiles and of the cards played on them. They are near enough
 * to read as a bundle, which is what their 3 different lines are for.
 */
const zoneInsetStep = gridGap
