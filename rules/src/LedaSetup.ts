import { getEnumValues, MaterialGameSetup } from '@gamepark/rules-api'
import { LedaOptions } from './LedaOptions'
import { LedaRules } from './LedaRules'
import { ActionTileId } from './material/ActionTileId'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { militaryVictoryTokens } from './material/MilitaryVictoryTokenId'
import { baseTiles } from './material/TileId'
import { RuleId } from './rules/RuleId'

/** Side of a player's square grid. */
const gridSize = 4

/**
 * This class creates a new Game based on the game options
 */
export class LedaSetup extends MaterialGameSetup<number, MaterialType, LocationType, LedaOptions> {
  Rules = LedaRules

  /**
   * Only the material that does not depend on a clan is set up here. Both players pick their clan once the game
   * has started (see {@link RuleId.ChooseClan}), so their deck, their Victory condition card and the extra material
   * of their clan, such as the Shark tokens, are created by that rule and not here.
   * Food is not set up either: its supply is not modelled, players are given their starting Food when they pick a clan.
   */
  setupMaterial() {
    for (const player of this.players) {
      this.setupGrid(player)
    }
    this.setupActionTiles()
    this.setupMilitaryVictoryTokens()
  }

  /**
   * Setup step 1: a player lays their 16 tiles into a 4x4 grid, front side up.
   * The rulebook does not prescribe any arrangement, and its setup illustration shows the 2 players with
   * different ones, so each grid is shuffled on its own.
   */
  setupGrid(player: number) {
    this.material(MaterialType.Tile).createItems(
      baseTiles.map((id, index) => ({
        id,
        location: { type: LocationType.PlayerGrid, player, x: index % gridSize, y: Math.floor(index / gridSize) }
      }))
    )
    // Shuffling keeps the locations in place and swaps the tiles between them, which is exactly laying the grid out.
    this.material(MaterialType.Tile).player(player).shuffle()
  }

  /** Setup step 2: the 5 Action tiles, shuffled into a face down pile between the players. */
  setupActionTiles() {
    this.material(MaterialType.ActionTile).createItems(
      getEnumValues(ActionTileId).map((id) => ({ id, location: { type: LocationType.ActionTileDeck } }))
    )
    this.material(MaterialType.ActionTile).shuffle()
  }

  /** Setup step 3: the 18 Military Victory tokens, shuffled into a face down pile between the players. */
  setupMilitaryVictoryTokens() {
    this.material(MaterialType.MilitaryVictoryToken).createItems(
      militaryVictoryTokens.map((id) => ({ id, location: { type: LocationType.MilitaryVictoryDeck } }))
    )
    this.material(MaterialType.MilitaryVictoryToken).shuffle()
  }

  /**
   * Setup step 5 gives the first player. The website already hands the players over in a random order,
   * so the first of them starts.
   */
  start() {
    this.startPlayerTurn(RuleId.ChooseClan, this.players[0])
  }
}
