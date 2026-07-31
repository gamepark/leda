import { MaterialRules } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { gridTiles } from '../material/PlayerGrid'
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

/** What a Flip may turn back: the Deserts of the player, the temporary tiles they have already activated. */
export const flippableDeserts = (rules: Rules, player: number) => {
  const tiles = gridTiles(rules.material(MaterialType.Tile), player)
  return tiles.id<TileId>((tile) => !isPermanent(tile)).rotation(true)
}
