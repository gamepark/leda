import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { DeckLocator, HandLocator, ListLocator, Locator, MaterialContext, PileLocator } from '@gamepark/react-game'
import { Location } from '@gamepark/rules-api'
import { tileSize } from '../material/TileDescription'

/**
 * The table is laid out in 3 columns: a player on the left, a player on the right, and what they share in between.
 * A player's column reads from top to bottom: their grid, then their clan material, then their panel with the Food
 * and the Military Victory tokens they own. All the values below are in centimeters, like the sizes of the material.
 */

/** Gap between 2 cells of a player's grid. */
const gridGap = 0.3

/** Distance between the centers of 2 consecutive cells of a grid. */
const gridStep = tileSize + gridGap

/** Distance from the center of the table to the center of a player's grid. */
const playerGridX = 22

/** Vertical center of a player's grid, at the top of their column. */
const playerGridY = -4

/** The row holding the Victory condition card, the deck and the hand of a player. */
const clanRowY = 15.5

/** Center of the fan of the hand, in the space left between the deck and the middle of the table. */
const handX = 15

/** The line the player panels sit on, at the bottom, where the Food and the Military Victory tokens go too. */
const playerLineY = 23

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
 * Something of a player placed at a fixed spot of their column, mirrored between the 2 players so that it always
 * sits at the same distance from its owner's panel.
 */
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
 * A row of a player, growing from their panel towards the middle of the table, mirrored between the 2 players.
 * maxCount caps how far a row may grow: past it the gap shrinks instead of the row getting longer, which is what
 * keeps the Food from running into the Military Victory tokens, and the 2 players from running into each other.
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

  gapX = 1.2
}

/**
 * The hand of a player, fanned between their deck and the middle of the table. The fan is centered on the anchor,
 * so the anchor is the middle of the space left by the Victory condition card and the deck.
 * The angles are kept small: the cards are square and 7 cm wide, so a wide fan would not fit in a player's column.
 */
class PlayerHandLocator extends HandLocator {
  radius = 30
  maxAngle = 15
  gapMaxAngle = 6

  getCoordinates(location: Location, context: MaterialContext) {
    return { x: playerSide(location.player, context) * handX, y: clanRowY }
  }
}

/** A pile of a player, mirrored between the 2 players. */
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

export const Locators: Partial<Record<LocationType, Locator<number, MaterialType, LocationType>>> = {
  [LocationType.PlayerGrid]: new PlayerGridLocator(),

  /** The clan row, from the panel side towards the middle: Victory condition card, deck, then the hand. */
  [LocationType.PlayerVictoryCondition]: new PlayerSpotLocator(32.9, clanRowY),
  [LocationType.PlayerDeck]: Object.assign(new PlayerSpotLocator(25.4, clanRowY), { limit: 5 }),
  [LocationType.PlayerHand]: new PlayerHandLocator(),

  /** The Shark tokens their owner has not placed yet, under their deck. Only in play if someone took the Sharks. */
  [LocationType.PlayerSharkSupply]: Object.assign(new PlayerPileLocator(25.4, 20.5), { radius: 1.2 }),

  [LocationType.PlayerFood]: Object.assign(new PlayerRowLocator(21, playerLineY), { gapX: 1, maxCount: 7 }),
  [LocationType.PlayerMilitaryVictory]: Object.assign(new PlayerRowLocator(13, playerLineY), { gapX: 1.05, maxCount: 9 }),

  /** The face down pile of Action tiles, at the top of the middle column. */
  [LocationType.ActionTileDeck]: new DeckLocator({ coordinates: { x: 0, y: -16 } }),

  /** The Action tiles revealed since the last shuffle, in a row below the pile. At most 4 of them. */
  [LocationType.ActionTileRevealed]: new ListLocator({ coordinates: { x: -4.05, y: -10.5 }, gap: { x: 2.7 }, maxCount: 4 }),

  /**
   * The face down pile of Military Victory tokens, in the middle of the table.
   * Only 5 of the 18 are rendered: a deeper stack costs DOM nodes without showing anything more.
   */
  [LocationType.MilitaryVictoryDeck]: new DeckLocator({ coordinates: { x: 0, y: -2 }, limit: 5 }),

  /**
   * The Food reserve, below the Military Victory pile. It holds no real item: the app displays a fixed pile of 20
   * (see the static item of the Food description), because the reserve is unlimited and not modelled in the rules.
   */
  [LocationType.FoodSupply]: new PileLocator({ coordinates: { x: 0, y: 6 }, radius: 1.8 })
}
