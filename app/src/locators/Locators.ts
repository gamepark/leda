import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { DeckLocator, HandLocator, ListLocator, Locator, MaterialContext, PileLocator } from '@gamepark/react-game'
import { Location } from '@gamepark/rules-api'
import { sharkTokenWidth } from '../material/SharkTokenDescription'
import { tileSize } from '../material/TileDescription'

/**
 * The table is laid out in 3 columns: a player on the left, a player on the right, and what they share in between.
 * A player's column is their 4x4 grid, with a side column one card wide on the outside of it, and their hand spread
 * underneath, next to their panel. The 2 players are mirrored, so the side column of each is always on their own
 * side of the table. All the values below are in centimeters, like the sizes of the material.
 */

/** Gap between 2 cells of a player's grid. */
const gridGap = 0.3

/** Distance between the centers of 2 consecutive cells of a grid. */
const gridStep = tileSize + gridGap

/** Distance from the center of the table to the center of a player's grid. */
const playerGridX = 17.4

/** Vertical center of a player's grid. */
const playerGridY = -6

/** Vertical center of a row of a player's grid, y being the 0..3 coordinate of the row. */
const gridRowY = (row: number) => playerGridY + (row - 1.5) * gridStep

/**
 * The column one card wide on the outside of a player's grid. It holds what a player owns and reads often,
 * each aligned with a row of their grid.
 */
const sideColumnX = playerGridX + (4 * tileSize + 3 * gridGap) / 2 + 0.6 + tileSize / 2

/**
 * The Shark tokens start flush with the outer edge of the deck above them rather than centered on it, so the row
 * reads as starting under the deck. Mirrored like everything else, so it is the left edge for the player on the
 * left and the right edge for the player on the right.
 */
const sharkRowX = sideColumnX + tileSize / 2 - sharkTokenWidth / 2

/**
 * The hand is spread under the grid, in the band the player panel sits in. handX is set so that the outer card of
 * the fan stops right where the panel starts, so it follows the table getting narrower.
 */
const handX = 14.6
const handY = 12.5

/**
 * Which side of the table a player is on: the player looking at the table is on the left, their opponent on the right.
 * Spectators see the first player on the left.
 */
const playerSide = (player: number | undefined, context: MaterialContext): number => {
  const me = context.player ?? context.rules.players[0]
  return player === me ? -1 : 1
}

/**
 * The 4x4 grid of a player. Cells are addressed by x and y in 0..3.
 * The 2 grids are on opposite sides of the table, but they are not mirrored: x grows to the right for both players,
 * so a player reads their opponent's grid the same way they read their own.
 */
class PlayerGridLocator extends Locator {
  getCoordinates(location: Location, context: MaterialContext) {
    return {
      x: playerSide(location.player, context) * playerGridX + (location.x! - 1.5) * gridStep,
      y: gridRowY(location.y!)
    }
  }
}

/** Something of a player placed at a fixed spot of their column, mirrored between the 2 players. */
class PlayerSpotLocator extends Locator {
  constructor(
    private readonly anchorX: number,
    private readonly anchorY: number
  ) {
    super()
  }

  getCoordinates(location: Location, context: MaterialContext) {
    return { x: playerSide(location.player, context) * this.anchorX, y: this.anchorY }
  }
}

/**
 * A row of a player, growing from their side of the table towards the middle, mirrored between the 2 players.
 * maxCount caps how long the row may get: past it the gap shrinks instead of the row getting longer.
 */
class PlayerRowLocator extends ListLocator {
  constructor(
    private readonly anchorX: number,
    private readonly anchorY: number
  ) {
    super()
  }

  getCoordinates(location: Location, context: MaterialContext) {
    return { x: playerSide(location.player, context) * this.anchorX, y: this.anchorY }
  }

  getGap(location: Location, context: MaterialContext) {
    return { x: -playerSide(location.player, context) * this.gapX }
  }

  gapX = 1.5
}

/** A pile of a player, mirrored between the 2 players. A pile rather than a row: the side column is one card wide. */
class PlayerPileLocator extends PileLocator {
  constructor(
    private readonly anchorX: number,
    private readonly anchorY: number
  ) {
    super()
  }

  getCoordinates(location: Location, context: MaterialContext) {
    return { x: playerSide(location.player, context) * this.anchorX, y: this.anchorY }
  }
}

/**
 * The hand of a player, fanned under their grid. The fan is centered on the anchor, and spread wide enough to use
 * the whole width of the grid: 6 cards or more span 27.8 cm, against 28.9 cm for the grid above.
 */
class PlayerHandLocator extends HandLocator {
  radius = 100
  maxAngle = 10
  gapMaxAngle = 4

  getCoordinates(location: Location, context: MaterialContext) {
    return { x: playerSide(location.player, context) * handX, y: handY, z: 5 }
  }
}

export const Locators: Partial<Record<LocationType, Locator<number, MaterialType, LocationType>>> = {
  [LocationType.PlayerGrid]: new PlayerGridLocator(),

  /** The side column, each spot lined up with a row of the grid. */
  [LocationType.PlayerVictoryCondition]: new PlayerSpotLocator(sideColumnX, gridRowY(0)),
  [LocationType.PlayerFood]: Object.assign(new PlayerPileLocator(sideColumnX, gridRowY(1)), { radius: 1.8 }),
  [LocationType.PlayerMilitaryVictory]: Object.assign(new PlayerPileLocator(sideColumnX, gridRowY(2)), { radius: 1.8 }),
  [LocationType.PlayerDeck]: Object.assign(new PlayerSpotLocator(sideColumnX, gridRowY(3)), { limit: 5 }),

  /**
   * The Shark tokens their owner has not placed yet, in a row under their deck, as wide as the side column plus the
   * grid column next to it. Only in play if someone took the Sharks.
   */
  [LocationType.PlayerSharkSupply]: Object.assign(new PlayerRowLocator(sharkRowX, 9.8), { gapX: 1.5, maxCount: 9 }),

  [LocationType.PlayerHand]: new PlayerHandLocator(),

  /**
   * The middle column, one item wide, read from top to bottom: the pile of Action tiles, the tiles revealed since
   * the last shuffle, the Food reserve, and the pile of Military Victory tokens.
   * The revealed tiles are stacked vertically rather than in a row, which is what keeps this column narrow.
   * The Food reserve, the widest item of the column, is kept high enough to stay beside the grids rather than
   * beside the hands: that is what lets the hands come closer to the middle of the table.
   */
  [LocationType.ActionTileDeck]: new DeckLocator({ coordinates: { x: 0, y: -18 } }),
  [LocationType.ActionTileRevealed]: new ListLocator({ coordinates: { x: 0, y: -12.5 }, gap: { y: 4.4 }, maxCount: 4 }),

  /**
   * The Food reserve holds no real item: the app displays a fixed pile of 20 (see the static item of the Food
   * description), because the reserve is unlimited and not modelled in the rules.
   */
  [LocationType.FoodSupply]: new PileLocator({ coordinates: { x: 0, y: 5.2 }, radius: 0.8 }),

  /** Only 5 of the 18 tokens are rendered: a deeper stack costs DOM nodes without showing anything more. */
  [LocationType.MilitaryVictoryDeck]: new DeckLocator({ coordinates: { x: 0, y: -1.5 }, limit: 5 })
}
