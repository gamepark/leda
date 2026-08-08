import { Material, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf } from '../material/PlayerGrid'
import { isPermanent } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { Rules } from '../Rules'
import { bareTiles } from './squares'

/**
 * The tiles an effect may ask a player to turn over, whether that effect comes from a tile they activated or from
 * a Military Victory token, and the tiles a card counts. The app reads these to know which tiles to offer, and the
 * rules that make the choice to know which moves are legal, so that the two can never disagree.
 *
 * Every one of them reads the bare tiles of the grid and none of them the whole 16: a card played on a square
 * covers its tile, and a covered tile is neither turned over nor counted (see {@link bareTiles}).
 */

/** What an Upgrade may turn over: the bare permanent tiles of the player that still show their front. */
export const upgradableTiles = (rules: Rules, player: number) =>
  bareTiles(rules, player)
    .id<TileId>(isPermanent)
    .rotation<boolean | undefined>((rotation) => rotation !== true)

/** The tiles of a player already showing their upgraded face, which is what the Orange Ring of the Cats counts. */
export const upgradedTiles = (rules: Rules, player: number) => bareTiles(rules, player).id<TileId>(isPermanent).rotation(true)

/** The Deserts a player can see: their temporary tiles, already activated, now showing the back that reminds them. */
export const visibleDeserts = (rules: Rules, player: number) => bareTiles(rules, player).id<TileId>((tile) => !isPermanent(tile)).rotation(true)

/**
 * The squares those tiles stand on. The rules that have a player activate a square and the buttons the app puts
 * on that square both name them this way, so that the two can never offer different squares.
 */
const cellsOf = (tiles: Material<number, MaterialType, LocationType>): XYCoordinates[] => tiles.getItems().map((tile) => cellOf(tile.location))

/** The squares a Shark card asking for a tile offers: every square whose tile is not under a card. */
export const bareCells = (rules: Rules, player: number): XYCoordinates[] => cellsOf(bareTiles(rules, player))

/** The squares a Scorpion card asking for a Desert offers. */
export const visibleDesertCells = (rules: Rules, player: number): XYCoordinates[] => cellsOf(visibleDeserts(rules, player))

/**
 * What a Scorpion Portal makes an opponent turn over: any of their bare tiles that is not on its worse face yet,
 * which for a permanent tile is its non upgraded front, and for a temporary one its Desert.
 * The 2 are one and the same thing to the player who owns them: a face they would rather not be showing.
 */
export const downgradableTiles = (rules: Rules, player: number) =>
  bareTiles(rules, player).filter<TileId>((tile) => (isPermanent(tile.id!) ? tile.location.rotation === true : tile.location.rotation !== true))

/** The face such a tile is turned onto: the Desert of a temporary tile, the front of a permanent one. */
export const worseFace = (tile: TileId): boolean => !isPermanent(tile)
