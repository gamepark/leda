import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { SharkSlot } from '@gamepark/leda/material/SharkSlot'
import { actionTileRoundPlayer } from '@gamepark/leda/rules/round'
import { DeckLocator, HandLocator, ItemContext, ListLocator, Locator, MaterialContext, ParentFace, PileLocator } from '@gamepark/react-game'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { FoodSupplyDescription } from '../material/FoodSupplyDescription'
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

/** The 2 piles of the middle column, named so that the Spy effect can send an item back where it came from. */
const actionTileDeck = { x: 0, y: -18 }
const militaryVictoryDeck = { x: 0, y: -1.5 }

/**
 * The revealed Action tiles are laid out in 2 columns of 2, under the pile they come from: one column on each
 * side of the middle of the table, and the tiles of the 3rd and 4th rounds under those of the first 2.
 * The columns are close enough to leave the middle column as narrow as it was when they were stacked.
 */
const revealedActionTileX = 1.4
const revealedActionTileY = -12.5
const revealedActionTileRow = 4.4

/**
 * Where the panel of a player sits, near the bottom corner of their side of the screen. The panels are html laid
 * over the table rather than material on it, so these 2 anchors are eyeballed at the default zoom: they are only
 * ever used to send an item towards a panel, never to line anything up with one.
 */
const panelX = 34
const panelTop = 13.2

/**
 * The item a Spy effect took off a pile, lifted over everything for as long as its owner looks at it.
 *
 * The player who is looking reads it where they took it, on top of the pile it comes from: nothing moves, and
 * their eyes are already there. Their opponent, who only sees its back, sees it travel to the panel of the player
 * looking at it, which is what says who is doing the looking: a card ends up half hidden under the panel, the
 * smaller items of the 2 other piles just above it.
 */
class SpiedItemLocator extends Locator {
  getItemCoordinates(item: MaterialItem<number, LocationType>, context: ItemContext<number, MaterialType, LocationType>) {
    const player = item.location.player!
    if (player === context.player) return { ...pileCoordinates(context.type, player, context), z: 10 }
    const { height = 0 } = context.material[context.type]?.getSize(item.id) ?? {}
    return {
      x: playerSide(player, context) * panelX,
      y: context.type === MaterialType.ClanCard ? panelTop : panelTop - height / 2 - 0.3,
      z: 10
    }
  }
}

/** Where the pile an item was taken from sits, so that looking at one of its items moves nothing. */
const pileCoordinates = (type: MaterialType, player: number, context: MaterialContext): Partial<Coordinates> => {
  switch (type) {
    case MaterialType.ActionTile:
      return actionTileDeck
    case MaterialType.MilitaryVictoryToken:
      return militaryVictoryDeck
    default:
      return { x: playerSide(player, context) * sideColumnX, y: gridRowY(3) }
  }
}

/**
 * The Action tiles revealed since the last shuffle, each on the side of the player who was the active one on the
 * round it was revealed: the first tile on the side of the player who opened the first of these rounds, the next
 * one facing it, and so on. Nothing of that is in the rules, which only number the tiles in the order they were
 * revealed: who a tile belongs to is read off that order and the active player of the current round.
 */
class RevealedActionTileLocator extends Locator {
  getCoordinates(location: Location, context: MaterialContext) {
    const index = location.x ?? 0
    return {
      x: playerSide(actionTileRoundPlayer(context.rules, index), context) * revealedActionTileX,
      y: revealedActionTileY + Math.floor(index / 2) * revealedActionTileRow
    }
  }
}

/**
 * A clan card played onto a square, laid on the tile of that square rather than on the square itself: the tile is
 * the parent item of its location, which is what makes a card follow it when 2 squares are swapped, dragged along
 * with it while the drag lasts and placed by it once it is over.
 * Several cards may pile up on one square, each covering the one before: they are laid in the order they were
 * played, a card thickness above one another.
 */
class PlayedCardLocator extends Locator {
  parentItemType = MaterialType.Tile

  /** A card is played on the square, not on a face of its tile: it stays there once the tile is turned over. */
  parentFace = ParentFace.Up

  getItemCoordinates(item: MaterialItem<number, LocationType>, context: ItemContext<number, MaterialType, LocationType>) {
    const thickness = context.material[context.type]?.getThickness(item, context) ?? 0
    return { z: this.cardsUnder(item, context) * thickness }
  }

  cardsUnder(item: MaterialItem<number, LocationType>, context: ItemContext<number, MaterialType, LocationType>): number {
    const cards = context.rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).parent(item.location.parent)
    return cards.getIndexes().filter((index) => index < context.index).length
  }

  /** How high a card sits depends on how many are already on its square, which is not part of its own location. */
  getPositionDependencies(location: Location, context: MaterialContext) {
    return this.countItems(location, context)
  }
}

/**
 * A Shark token placed on a square, on the tile of that square like a card is, so that it follows it when 2
 * squares are swapped.
 * It covers one of the 2 effect slots printed across the bottom of the Shark card underneath, which is what the x
 * of its location says (see {@link SharkSlot}), and it is laid over that card rather than under it.
 */
class PlacedSharkTokenLocator extends Locator {
  parentItemType = MaterialType.Tile
  parentFace = ParentFace.Up

  getItemCoordinates(item: MaterialItem<number, LocationType>, context: ItemContext<number, MaterialType, LocationType>): Partial<Coordinates> {
    return { x: item.location.x === SharkSlot.Left ? -sharkSlotX : sharkSlotX, y: sharkSlotY, z: this.cardsUnder(item, context) * cardThickness }
  }

  cardsUnder(item: MaterialItem<number, LocationType>, context: ItemContext<number, MaterialType, LocationType>): number {
    return context.rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).parent(item.location.parent).length
  }

  /** How high a token sits depends on how many cards are on its square, which is not part of its own location. */
  getPositionDependencies(location: Location, context: MaterialContext) {
    return context.rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).parent(location.parent).length
  }
}

/**
 * Where the 2 effect slots of a Shark card are, read off its artwork: the effect area is the bottom band, split
 * down the middle, so a slot is centered a quarter of the card away from its middle in both directions.
 */
const sharkSlotX = tileSize / 4
const sharkSlotY = tileSize / 3

/** Cards are 0.05 cm thick, which is what CardDescription counts a pile of them in. */
const cardThickness = 0.05

/**
 * The Food reserve. Its location is declared so that it is always on the table, since it is what carries the
 * button of an organisation (see {@link FoodSupplyDescription}): the reserve holds no item of the game state.
 */
class FoodSupplyLocator extends PileLocator {
  location = { type: LocationType.FoodSupply }
  locationDescription = new FoodSupplyDescription()
  radius = 2
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

  /**
   * A card the player cannot see is not hovered at all: the 4 clans have a back each, so the framework leaves the
   * hover on, but within one hand every card shows the same emblem and there is nothing to look closer at.
   * Asked of the description rather than compared here, so that what counts as face down is written once.
   *
   * The others rise 2 cm above what the framework already does, which straightens the card and doubles its size:
   * a hand sits at the bottom edge of the table, so a card that only grows in place has its lower half hidden
   * behind the panel of its owner. Lifted first, before the rest, so that the 2 cm are not doubled by the scale.
   */
  getHoverTransform(item: MaterialItem, context: ItemContext) {
    if (context.material[context.type]?.isFlippedOnTable(item, context)) return []
    return ['translate(2em, -3em)', ...super.getHoverTransform(item, context)]
  }
}

export const Locators: Partial<Record<LocationType, Locator<number, MaterialType, LocationType>>> = {
  [LocationType.PlayerGrid]: new PlayerGridLocator(),
  [LocationType.PlayedCard]: new PlayedCardLocator(),
  [LocationType.PlacedSharkToken]: new PlacedSharkTokenLocator(),

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
   * The middle column, read from top to bottom: the pile of Action tiles, the tiles revealed since the last
   * shuffle, the Food reserve, and the pile of Military Victory tokens. Everything but the revealed tiles is one
   * item wide, and the 2 columns those form are narrow enough to fit between the grids all the same.
   * The Food reserve, the widest item of the column, is kept high enough to stay beside the grids rather than
   * beside the hands: that is what lets the hands come closer to the middle of the table.
   */
  [LocationType.ActionTileDeck]: new DeckLocator({ coordinates: actionTileDeck }),
  [LocationType.ActionTileRevealed]: new RevealedActionTileLocator(),

  /**
   * The Food reserve holds no real item: the app displays a fixed pile of 20 (see the static item of the Food
   * description), because the reserve is unlimited and not modelled in the rules.
   */
  [LocationType.FoodSupply]: new FoodSupplyLocator({ coordinates: { x: 0, y: 5.2 }, radius: 0.8 }),

  /** Only 5 of the 18 tokens are rendered: a deeper stack costs DOM nodes without showing anything more. */
  [LocationType.MilitaryVictoryDeck]: new DeckLocator({ coordinates: militaryVictoryDeck, limit: 5 }),

  [LocationType.SpiedItem]: new SpiedItemLocator()
}
