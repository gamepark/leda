/**
 * The 5 Action tiles shared by both players.
 *
 * One is revealed at the beginning of each round: it offers a few zones of 4 squares, and each player chooses
 * one of them and activates its 4 squares of their own grid. Once the 4th tile has been revealed, all 5 are
 * shuffled face down again, so the 5th tile is only played once every 2 cycles.
 *
 * The values match the number printed on the tiles, which the rulebook refers to ("Action tile #2").
 * Tiles 1 to 4 all offer a row, a column and a 2x2 square, all sharing the same index: tile 3 offers row 3,
 * column 3, and the 2x2 square whose corner is the 3rd corner in reading order.
 */
export enum ActionTileId {
  /** Row 1, column 1, or the top left 2x2 square. */
  TopLeft = 1,
  /** Row 2, column 2, or the top right 2x2 square. */
  TopRight,
  /** Row 3, column 3, or the bottom left 2x2 square. */
  BottomLeft,
  /** Row 4, column 4, or the bottom right 2x2 square. */
  BottomRight,
  /** The 4 corner squares, or the 4 center squares. No row, no column, no 2x2 square. */
  CornersOrCenter
}
