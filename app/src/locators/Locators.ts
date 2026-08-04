import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { SharkSlot } from '@gamepark/leda/material/SharkSlot'
import { sharkSlotOn } from '@gamepark/leda/rules/sharkPack'
import { actionTileRoundPlayer } from '@gamepark/leda/rules/round'
import { DeckLocator, HandLocator, ItemContext, ListLocator, Locator, MaterialContext, ParentFace, PileLocator } from '@gamepark/react-game'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { actionTile } from '../material/ActionTileDescription'
import { FoodSupplyDescription } from '../material/FoodSupplyDescription'
import { foodToken } from '../material/FoodTokenDescription'
import { militaryVictoryToken } from '../material/MilitaryVictoryTokenDescription'
import { sharkToken } from '../material/SharkTokenDescription'
import { tileSize } from '../material/TileDescription'

/**
 * The table is laid out in 3 columns: a player on the left, a player on the right, and what they share in between.
 * A player's column is their 4x4 grid, with a side column one card wide on the outside of it, and their hand spread
 * underneath, next to their panel. The 2 players are mirrored, so the side column of each is always on their own
 * side of the table. All the values below are in centimeters, like the sizes of the material.
 */

/** A piece of the table, by what it measures. */
type Piece = { width: number; height: number }

/** Gap between 2 cells of a player's grid. */
const gridGap = 0.3

/** Distance between the centers of 2 consecutive cells of a grid. */
const gridStep = tileSize + gridGap

/** Half the width of a player's 4x4 grid. */
const gridHalfWidth = (4 * tileSize + 3 * gridGap) / 2

/** Gap between 2 columns of the table, wide enough that nothing of one reads as touching the next. */
const columnGap = 0.6

/**
 * The revealed Action tiles are laid out in 2 columns of 2, under the pile they come from: one column on each side
 * of the middle of the table, and the tiles of the 3rd and 4th rounds under those of the first 2. The 2 columns are
 * one gap of the grids apart, so that the 4 tiles read as a block of the same kind as a grid.
 */
const revealedActionTileX = (actionTile.width - 2 * actionTile.margin + gridGap) / 2

/**
 * Half the width of the middle column: the 2 columns of revealed Action tiles, which are the widest thing in it,
 * the piles above and below them being one item wide.
 */
const middleColumnHalfWidth = revealedActionTileX + actionTile.width / 2 - actionTile.margin

/** Distance from the center of the table to the center of a player's grid. */
const playerGridX = middleColumnHalfWidth + columnGap + gridHalfWidth

/** Vertical center of a player's grid. */
const playerGridY = -6

/** Vertical center of a row of a player's grid, y being the 0..3 coordinate of the row. */
const gridRowY = (row: number) => playerGridY + (row - 1.5) * gridStep

/** Top edge of the first row of a player's grid, which is where the middle column starts too. */
const gridTop = gridRowY(0) - tileSize / 2

/**
 * The column one card wide on the outside of a player's grid. It holds what a player owns and reads often,
 * each aligned with a row of their grid.
 */
const sideColumnX = playerGridX + gridHalfWidth + columnGap + tileSize / 2

/** The table is exactly as wide as the 2 player columns, plus a small margin outside of them. */
export const tableXMax = sideColumnX + tileSize / 2 + 0.9

/** Gap between what the side column holds and what is above or below it. */
const sideColumnGap = 0.3

/**
 * The clan card at the top of the side column and the deck at the bottom leave a space between them, which a
 * player's tokens fill in 2 columns, each centered on one quarter of the card above them: the Shark tokens they
 * have not placed yet on the first quarter, the Military Victory tokens they have won on the third one.
 * Both are read from top to bottom, and both keep the same side of the card for the 2 players, like the grids do.
 */
const tokenColumnTop = gridRowY(0) + tileSize / 2 + sideColumnGap
const tokenColumnBottom = gridRowY(3) - tileSize / 2 - sideColumnGap

/** The quarter of the card above a column of tokens that its tokens are centered on, left of the middle or right. */
const firstQuarter = -tileSize / 4
const thirdQuarter = tileSize / 4

/** Where the first token of a column sits, the one right under the clan card. */
const tokenColumnY = (token: Piece) => tokenColumnTop + token.height / 2

/** The gap that leaves sideColumnGap of empty space between 2 consecutive tokens of a column. */
const tokenColumnGap = (token: Piece) => token.height + sideColumnGap

/**
 * How far the last token of a column may get from the first one. A column stops right above the deck however many
 * tokens it holds: past that they overlap one another instead of the column getting any longer.
 */
const tokenColumnHeight = (token: Piece) => tokenColumnBottom - tokenColumnTop - token.height

/**
 * A column with no room left at all stacks its tokens one on top of the other. Not 0: the framework reads a
 * maximum gap of 0 as no maximum, and would spread the tokens at their natural gap instead.
 */
const stacked = 0.01

/**
 * A player wins on their 10th Military Victory token, so a column may have to show 9 of them, which is more than
 * the space between the clan card and the deck can hold. The first 5 go down the third quarter of that space,
 * tight enough to fill it on their own, and the ones after that go up the first quarter, under the Shark tokens.
 */
const militaryVictoryFirstColumn = 5

/** The step between 2 Military Victory tokens. The 2 columns share it, so they read as one series. */
const militaryVictoryStep = tokenColumnHeight(militaryVictoryToken) / (militaryVictoryFirstColumn - 1)

/**
 * How far down the space a Military Victory token sits, counted in steps: 0 at the top of either column and
 * militaryVictoryFirstColumn - 1 at the bottom, since the 2 columns share their steps.
 */
const militaryVictoryRow = (y: number) => (y - tokenColumnTop - militaryVictoryToken.height / 2) / militaryVictoryStep

/** How many Military Victory tokens a player has won past the ones the first column holds. */
const militaryVictoryOverflow = (player: number | undefined, context: MaterialContext) =>
  Math.max(
    0,
    context.rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(player).length -
      militaryVictoryFirstColumn
  )

/**
 * Where the Shark tokens of a player have to stop: right above the Military Victory tokens that have come up into
 * their column, or at the bottom of the space if their owner has not won 6 of them yet.
 */
const sharkColumnBottom = (player: number | undefined, context: MaterialContext) => {
  const overflow = militaryVictoryOverflow(player, context)
  if (overflow === 0) return tokenColumnBottom
  return tokenColumnBottom - militaryVictoryToken.height - (overflow - 1) * militaryVictoryStep - sideColumnGap
}

/**
 * The Food a player owns, in a row under their deck, as wide as the side column plus the grid column next to it.
 * It starts flush with the outer edge of the deck above it rather than centered on it, so the row reads as
 * starting under the deck. Mirrored like everything else, so it is the left edge for the player on the left.
 */
const foodRowX = sideColumnX + tileSize / 2 - foodToken.width / 2
const foodRowY = 9.8

/**
 * The hand is spread under the grid, in the band the player panel sits in. handX is set so that the outer card of
 * the fan stops right where the panel starts, so it follows the table getting narrower.
 */
const handX = 15.8
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

/**
 * The middle column is read from top to bottom: the pile of Action tiles, the 2 rows of tiles revealed since the
 * last shuffle, the pile of Military Victory tokens, and the Food reserve. It starts level with the first row of
 * the grids, and each item is laid under the one before it, a gap apart.
 */
const middleColumnGap = 0.4

/**
 * Half the height of an Action tile, measured on the tile itself rather than on its image: it is the tile that
 * has to start level with the first row of the grids, not the transparent margin its image carries around it.
 */
const halfActionTile = actionTile.height / 2 - actionTile.margin

/** The 2 piles of the middle column, named so that the Spy effect can send an item back where it came from. */
const actionTileDeck = { x: 0, y: gridTop + halfActionTile }
const revealedActionTileY = actionTileDeck.y + 2 * halfActionTile + middleColumnGap
const revealedActionTileRow = 2 * halfActionTile + middleColumnGap
const militaryVictoryDeck = {
  x: 0,
  y: revealedActionTileY + revealedActionTileRow + halfActionTile + middleColumnGap + militaryVictoryToken.height / 2
}

/**
 * The Food reserve closes the column, under the pile of Military Victory tokens. It is a heap scattered around
 * its center rather than a piece with edges, so where it sits is set by eye instead of being laid out from the
 * pile above it: the tokens that reach foodSupplyRadius out of the heap are few, and it reads as smaller than it
 * measures. It still ends above the bottom of the grids.
 */
const foodSupplyRadius = 0.8
const foodSupplyY = 6.07

/**
 * Where the panel of a player sits, near the bottom corner of their side of the screen. The panels are html laid
 * over the table rather than material on it, so these 2 anchors are eyeballed at the default zoom: they are only
 * ever used to send an item towards a panel, never to line anything up with one.
 */
const panelX = 35.4
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

  /**
   * A Cat card prints its 2 effects at opposite ends, the second one upside down, and alternates between them by
   * taking a half turn as it is activated. That half turn is the rotation of its location, and it is a real half
   * turn on the table: the effect that is up is the one the right way round for its owner.
   */
  getItemRotateZ(item: MaterialItem<number, LocationType>) {
    return item.location.rotation === true ? 180 : 0
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
 * squares are swapped. It is laid over the cards of its square rather than under them.
 *
 * It covers one of the 2 effect slots printed across the bottom of the Shark card underneath, and which one is not
 * part of its location: the squares around it are what decide, so it is asked of the rules here, and the token
 * slides from one slot to the other as the board changes around it (see {@link sharkSlotOn}).
 */
class PlacedSharkTokenLocator extends Locator {
  parentItemType = MaterialType.Tile
  parentFace = ParentFace.Up

  getItemCoordinates(item: MaterialItem<number, LocationType>, context: ItemContext<number, MaterialType, LocationType>): Partial<Coordinates> {
    return { x: this.slot(item.location, context) === SharkSlot.Left ? -sharkSlotX : sharkSlotX, y: sharkSlotY, z: this.cardsUnder(item.location, context) * cardThickness }
  }

  slot(location: Location, context: MaterialContext): SharkSlot | undefined {
    if (location.player === undefined || location.parent === undefined) return undefined
    const tile = context.rules.material(MaterialType.Tile).getItem(location.parent)
    return tile === undefined ? undefined : sharkSlotOn(context.rules, location.player, cellOf(tile.location))
  }

  cardsUnder(location: Location, context: MaterialContext): number {
    return context.rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).parent(location.parent).length
  }

  /**
   * Neither the slot of a token nor how high it sits is part of its own location: the first is read off the
   * squares around it, the second off the cards under it. Both are declared here, so that a token is drawn again
   * when what it depends on moves.
   */
  getPositionDependencies(location: Location, context: MaterialContext) {
    return [this.slot(location, context), this.cardsUnder(location, context)]
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

/**
 * A column of a player, growing downwards from its anchor. The column always reads from top to bottom, whichever
 * side of the table its owner is on, and so does the side column it sits in: only the anchor is mirrored between
 * the 2 players, never the offset from it. Like the grids, the 2 side columns are on opposite sides of the table
 * but they are not mirrored, so a player reads their opponent's the same way they read their own.
 * maxGap caps how long the column may get: past it the items overlap instead of the column getting longer.
 */
class PlayerColumnLocator extends ListLocator {
  constructor(
    private readonly anchorX: number,
    private readonly offsetX: number,
    private readonly anchorY: number
  ) {
    super()
  }

  getCoordinates(location: Location, context: MaterialContext) {
    return { x: playerSide(location.player, context) * this.anchorX + this.offsetX, y: this.anchorY }
  }
}

/**
 * The Shark tokens a player has not placed yet, down the first quarter of the space between their clan card and
 * their deck. They give way to the Military Victory tokens that come up into that column: the more of those their
 * owner has won, the more the Shark tokens overlap one another to stay above them.
 * Once 9 Military Victory tokens are up, less than one token of height is left and the Sharks only stack: at that
 * point their owner is one token away from winning, so the column is about to be read for the last time.
 */
class SharkSupplyLocator extends PlayerColumnLocator {
  getMaxGap(location: Location, context: MaterialContext) {
    return { y: Math.max(stacked, sharkColumnBottom(location.player, context) - tokenColumnTop - sharkToken.height) }
  }

  /** How tight the column is is not read off the Shark tokens alone, so the Military Victory ones are declared. */
  getPositionDependencies(location: Location, context: MaterialContext) {
    return [this.countItems(location, context), militaryVictoryOverflow(location.player, context)]
  }
}

/**
 * The Military Victory tokens a player has won: the first ones down the third quarter of the space between their
 * clan card and their deck, the ones after that up the first quarter, from the bottom.
 * Each token has a spot of its own, read off the number it was given when it was won (see the location strategy of
 * PlayerMilitaryVictory), so none of them moves when the next one arrives.
 *
 * They are close enough to overlap, and a token always covers the one above it rather than the one below: z
 * follows y, so a column is lit from the top the way a fanned hand of cards is, in either of the 2 columns and
 * whichever order the tokens were won in.
 */
class MilitaryVictoryLocator extends Locator {
  getItemCoordinates(item: MaterialItem<number, LocationType>, context: ItemContext<number, MaterialType, LocationType>): Partial<Coordinates> {
    const index = this.getItemIndex(item, context)
    const firstColumn = index < militaryVictoryFirstColumn
    const y = firstColumn
      ? tokenColumnTop + militaryVictoryToken.height / 2 + index * militaryVictoryStep
      : tokenColumnBottom - militaryVictoryToken.height / 2 - (index - militaryVictoryFirstColumn) * militaryVictoryStep
    const thickness = context.material[context.type]?.getThickness(item, context) ?? 0
    return {
      x: playerSide(item.location.player, context) * sideColumnX + (firstColumn ? thirdQuarter : firstQuarter),
      y,
      z: militaryVictoryRow(y) * thickness
    }
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

  /** The side column: the clan card at the top and the deck at the bottom, each lined up with a row of the grid. */
  [LocationType.PlayerVictoryCondition]: new PlayerSpotLocator(sideColumnX, gridRowY(0)),
  [LocationType.PlayerDeck]: Object.assign(new PlayerSpotLocator(sideColumnX, gridRowY(3)), { limit: 10 }),

  /**
   * The 2 columns of tokens between the 2, on the quarters of the card above them (see {@link tokenColumnTop}).
   * The Shark tokens are the supply their owner draws from, and the Military Victory tokens are what they are
   * racing to collect, so the second ones take the room they need and the first ones give way.
   * Both are worth reading one by one, unlike the Food: what a Military Victory token does is printed on it, and
   * the symbols of a whole column are what decides who becomes the active player.
   */
  [LocationType.PlayerSharkSupply]: Object.assign(new SharkSupplyLocator(sideColumnX, firstQuarter, tokenColumnY(sharkToken)), {
    gap: { y: tokenColumnGap(sharkToken) }
  }),
  [LocationType.PlayerMilitaryVictory]: new MilitaryVictoryLocator(),

  /** The Food a player owns, in the row under their deck the Shark tokens used to be in. */
  [LocationType.PlayerFood]: Object.assign(new PlayerRowLocator(foodRowX, foodRowY), { gapX: 1.5, maxCount: 9 }),

  [LocationType.PlayerHand]: new PlayerHandLocator(),

  /**
   * The middle column, laid out from its top edge downwards (see {@link middleColumnGap}): the pile of Action
   * tiles, the tiles revealed since the last shuffle, the pile of Military Victory tokens, and the Food reserve.
   * The column is as wide as the 2 columns of revealed tiles, and the grids are pushed apart to make room for it.
   */
  [LocationType.ActionTileDeck]: new DeckLocator({ coordinates: actionTileDeck }),
  [LocationType.ActionTileRevealed]: new RevealedActionTileLocator(),

  /**
   * The Food reserve holds no real item: the app displays a fixed pile of 20 (see the static item of the Food
   * description), because the reserve is unlimited and not modelled in the rules.
   * It is the one item of the column that hangs below the grids, in the band the hands are in: it stays clear of
   * them because the hands are fanned, so their innermost card is both lower and turned away from it.
   */
  [LocationType.FoodSupply]: new FoodSupplyLocator({ coordinates: { x: 0, y: foodSupplyY }, radius: foodSupplyRadius }),

  /** Only 5 of the 18 tokens are rendered: a deeper stack costs DOM nodes without showing anything more. */
  [LocationType.MilitaryVictoryDeck]: new DeckLocator({ coordinates: militaryVictoryDeck, limit: 5 }),

  [LocationType.SpiedItem]: new SpiedItemLocator()
}
