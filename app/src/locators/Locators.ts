import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { DeckLocator, ListLocator, Locator, MaterialContext, PileLocator } from '@gamepark/react-game'
import { Location } from '@gamepark/rules-api'
import { tileSize } from '../material/Material'

/**
 * The table is laid out in 3 columns: a player on the left, a player on the right, and what they share in between.
 * All the values below are in centimeters, like the sizes of the material.
 */

/** Gap between 2 cells of a player's grid. */
const gridGap = 0.3

/** Distance between the centers of 2 consecutive cells of a grid. */
const gridStep = tileSize + gridGap

/** Distance from the center of the table to the center of a player's grid. */
const playerGridX = 22

/** The line the player panels sit on, at the bottom, where the Food and the Military Victory tokens go too. */
const playerLineY = 19

/** Vertical center of a player's grid, above their panel. */
const playerGridY = -1

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
      y: playerGridY + (location.y! - 1.5) * gridStep
    }
  }
}

/**
 * The Food and the Military Victory tokens a player owns, on the same line as their panel.
 * Those 2 rows are mirrored, so that both start next to their owner's panel and grow towards the middle of the table.
 * Their maxCount caps how far they may grow: past it the gap shrinks instead of the row getting longer, which is what
 * keeps the Food from running into the Military Victory tokens, and the 2 players from running into each other.
 */
class PlayerLineLocator extends ListLocator {
  constructor(private readonly anchorX: number) {
    super()
  }

  getCoordinates(location: Location, context: MaterialContext) {
    return { x: playerSide(location.player, context) * this.anchorX, y: playerLineY }
  }

  getGap(location: Location, context: MaterialContext) {
    return { x: -playerSide(location.player, context) * this.gapX }
  }

  gapX = 1.2
}

export const Locators: Partial<Record<LocationType, Locator<number, MaterialType, LocationType>>> = {
  [LocationType.PlayerGrid]: new PlayerGridLocator(),

  [LocationType.PlayerFood]: Object.assign(new PlayerLineLocator(21), { gapX: 1, maxCount: 7 }),
  [LocationType.PlayerMilitaryVictory]: Object.assign(new PlayerLineLocator(13), { gapX: 1.05, maxCount: 9 }),

  /** The face down pile of Action tiles, at the top of the middle column. */
  [LocationType.ActionTileDeck]: new DeckLocator({ coordinates: { x: 0, y: -13 } }),

  /** The Action tiles revealed since the last shuffle, in a row below the pile. At most 4 of them. */
  [LocationType.ActionTileRevealed]: new ListLocator({ coordinates: { x: -4.05, y: -7.5 }, gap: { x: 2.7 }, maxCount: 4 }),

  /**
   * The face down pile of Military Victory tokens, in the middle of the table.
   * Only 5 of the 18 are rendered: a deeper stack costs DOM nodes without showing anything more.
   */
  [LocationType.MilitaryVictoryDeck]: new DeckLocator({ coordinates: { x: 0, y: 1 }, limit: 5 }),

  /**
   * The Food reserve, below the Military Victory pile. It holds no real item: the app displays a fixed pile of 20
   * (see the static item of the Food description), because the reserve is unlimited and not modelled in the rules.
   */
  [LocationType.FoodSupply]: new PileLocator({ coordinates: { x: 0, y: 8.5 }, radius: 1.8 })
}
