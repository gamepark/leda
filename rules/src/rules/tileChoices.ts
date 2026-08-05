import { Material, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, gridTiles } from '../material/PlayerGrid'
import { isPermanent } from '../material/TileEffect'
import { TileId } from '../material/TileId'

/**
 * The tiles an effect may ask a player to turn over, whether that effect comes from a tile they activated or from
 * a Military Victory token. The app reads these to know which tiles to offer, and the rules that make the choice
 * to know which moves are legal, so that the two can never disagree.
 */

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

/** What an Upgrade may turn over: the permanent tiles of the player that still show their front. */
export const upgradableTiles = (rules: Rules, player: number) => {
  const tiles = gridTiles(rules.material(MaterialType.Tile), player)
  return tiles.id<TileId>(isPermanent).rotation<boolean | undefined>((rotation) => rotation !== true)
}

/**
 * The tiles of a player already showing their upgraded face, which is what the Orange Ring of the Cats counts.
 * Covered tiles are counted too: a card hides what a tile gives, and not the fact that it was upgraded.
 */
export const upgradedTiles = (rules: Rules, player: number) => {
  const tiles = gridTiles(rules.material(MaterialType.Tile), player)
  return tiles.id<TileId>(isPermanent).rotation(true)
}

/** The Deserts of a player: their temporary tiles, already activated, now showing the back that reminds them. */
export const deserts = (rules: Rules, player: number) => {
  const tiles = gridTiles(rules.material(MaterialType.Tile), player)
  return tiles.id<TileId>((tile) => !isPermanent(tile)).rotation(true)
}

/**
 * The tiles a card covers. A card covers the tile of its square, so what that tile shows is off the table for as
 * long as the card is there: it is neither counted by what reads the grid nor reached by what activates a square.
 *
 * Which tile a card covers is the item its location points to, so this is read off the cards rather than off the
 * tiles. That is also what keeps it out of {@link playedCards}, whose readers of clan cards would come back around
 * to the cards that call this.
 */
const coveredTiles = (rules: Rules, player: number): Set<number | undefined> =>
  new Set(
    rules
      .material(MaterialType.ClanCard)
      .location(LocationType.PlayedCard)
      .player(player)
      .getItems()
      .map((card) => card.location.parent)
  )

/** The tiles of a player that no card covers, the only ones an effect asking for a tile can reach. */
export const bareTiles = (rules: Rules, player: number) => {
  const covered = coveredTiles(rules, player)
  return gridTiles(rules.material(MaterialType.Tile), player).filter((_, index) => !covered.has(index))
}

/** The Deserts a player can see, which is what their clan cards count and what an ActivateDesert may read. */
export const visibleDeserts = (rules: Rules, player: number) => {
  const covered = coveredTiles(rules, player)
  return deserts(rules, player).filter((_, index) => !covered.has(index))
}

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
 * What a Scorpion Portal makes an opponent turn over: any of their tiles that is not on its worse face yet, which
 * for a permanent tile is its non upgraded front, and for a temporary one its Desert.
 * The 2 are one and the same thing to the player who owns them: a face they would rather not be showing.
 */
export const downgradableTiles = (rules: Rules, player: number) =>
  gridTiles(rules.material(MaterialType.Tile), player).filter<TileId>((tile) =>
    isPermanent(tile.id!) ? tile.location.rotation === true : tile.location.rotation !== true
  )

/** The face such a tile is turned onto: the Desert of a temporary tile, the front of a permanent one. */
export const worseFace = (tile: TileId): boolean => !isPermanent(tile)
