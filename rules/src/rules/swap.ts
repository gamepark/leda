import { MaterialMove, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, gridTiles, tileAt } from '../material/PlayerGrid'
import { RuleId } from './RuleId'

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * Swapping 2 squares of a player's own grid, which the organisation offers for 1 Food and a Scorpion Portal for
 * free. Shared so that the 2 always mean the same thing by a swap, the Portal being written as "swap the position
 * of 2 of your cards or tiles", which is the very move an organisation makes.
 *
 * A swap is 2 moves: the drag says which tile is taken and where it goes, and the tile that was there is sent the
 * other way round. The cards played on a square follow their tile on their own, being parented to it, which is
 * what makes a swap move "cards or tiles" while only ever moving tiles.
 */

/**
 * The player who may swap 2 of their own squares right now, if any: the one organising their grid, and the one a
 * Scorpion Portal is asking (see {@link OrganisationRule} and {@link SwapSquaresRule}). The 2 are one and the same
 * question for the table, which has to let a tile be taken from under the cards played on it and to shine on the
 * squares that may be moved, and both rules answer a swap with the very same drag.
 */
export const swappingPlayer = (rules: Rules): number | undefined =>
  rules.game.rule?.id === RuleId.Organisation || rules.game.rule?.id === RuleId.SwapSquares ? rules.game.rule.player : undefined

/** Every swap of the grid, in both directions: a tile taken to the square of any other tile. */
export const swapMoves = (rules: Rules, player: number): Move[] => {
  const tiles = gridTiles(rules.material(MaterialType.Tile), player)
  const cells = tiles.getItems().map((tile) => cellOf(tile.location))
  return tiles
    .getIndexes()
    .flatMap((index, position) =>
      cells.filter((_, other) => other !== position).map((cell) => tiles.index(index).moveItem((tile) => ({ ...tile.location, ...cell })))
    )
}

/**
 * The other half of a swap: the tile standing on the square being moved to, sent to the square the first one is
 * leaving. Undefined when the square is empty, which is what the second half of a swap lands on.
 *
 * Read before the move is played: it is the only moment the state still says which tile was where. The location
 * is built from the tile itself, so that it keeps the face it was showing, upgraded or Desert.
 */
export const swapBackMove = (rules: Rules, player: number, index: number, to: XYCoordinates): Move | undefined => {
  const swapped = tileAt(rules.material(MaterialType.Tile), player, to)
  if (!swapped.length) return undefined
  const { x, y } = rules.material(MaterialType.Tile).getItem(index).location
  return swapped.moveItem((tile) => ({ ...tile.location, x, y }))
}

/**
 * Whether the grid is whole again, which is what the second half of a swap leaves behind: the first half puts 2
 * tiles on one square and leaves another one empty, and that is how the halves are told apart.
 */
export const isGridSettled = (rules: Rules, player: number): boolean => {
  const cells = gridTiles(rules.material(MaterialType.Tile), player)
    .getItems()
    .map((tile) => cellOf(tile.location))
  return new Set(cells.map(({ x, y }) => `${x},${y}`)).size === cells.length
}
