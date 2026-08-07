import { ActionZone, zoneContains } from '@gamepark/leda/material/ActionZone'
import { gridCells } from '@gamepark/leda/material/PlayerGrid'
import { copper, copperActive, parchment } from '../theme'

/**
 * A zone drawn the way the Action tiles draw the ones they offer: the 4x4 grid of a player in small, its squares
 * as rounded outlines, and the 4 squares of the zone filled in dark.
 * The tiles print the zones they offer one over the other, with the squares 2 of them share in a middle tone. Here
 * there is only ever one zone to show, so a square is either of it or not, and 4 of the 16 are dark.
 *
 * Drawn rather than an image: it is one shape per zone, and the 14 zones would be 14 files of the same 16 squares.
 */

/** The side of a square and the step between 2 of them, on a grid 100 units wide: 4 * 22 + 3 * 4 = 100. */
const square = 22
const step = 26

/** The outlines are drawn on the edge of a square, so half of their width falls outside of the 100 units. */
const stroke = 2

export const ZoneIcon = ({ zone, size }: { zone: ActionZone; size: number }) => (
  <svg
    viewBox={`${-stroke / 2} ${-stroke / 2} ${100 + stroke} ${100 + stroke}`}
    css={{ width: `${size}em`, height: `${size}em`, overflow: 'visible' }}
  >
    {gridCells.map((cell) => (
      <rect
        key={`${cell.x},${cell.y}`}
        x={cell.x * step}
        y={cell.y * step}
        width={square}
        height={square}
        rx={5}
        fill={zoneContains(zone, cell) ? copperActive : parchment}
        stroke={copper}
        strokeWidth={stroke}
      />
    ))}
  </svg>
)
