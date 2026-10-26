import { getEnumValues, MaterialGameSetup, MaterialMoveBuilder } from '@gamepark/rules-api'
import { shuffle } from 'es-toolkit'
import { Clan } from './Clan'
import { ClanSelection } from './ClanSelection'
import { LedaOptions } from './LedaOptions'
import { LedaRules } from './LedaRules'
import { ActionTileId } from './material/ActionTileId'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { baseTiles } from './material/TileId'
import { CustomMoveType } from './rules/CustomMoveType'
import { Memory } from './rules/Memory'
import { RuleId } from './rules/RuleId'
import { militaryVictoryPile } from './rules/tournament'

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
  setupMaterial(options: LedaOptions) {
    const tournamentRules = options.tournamentRules === true
    if (tournamentRules) this.memorize(Memory.TournamentRules, true)
    for (const player of this.players) {
      this.setupGrid(player)
    }
    this.setupActionTiles()
    this.setupMilitaryVictoryTokens(tournamentRules)
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

  /**
   * Setup step 3: the 18 Military Victory tokens, shuffled into a face down pile between the players.
   * The tournament rules leave the 2 tokens worth 2 Victory symbols in the box, which makes a pile of 16.
   */
  setupMilitaryVictoryTokens(tournamentRules: boolean) {
    this.material(MaterialType.MilitaryVictoryToken).createItems(
      militaryVictoryPile(tournamentRules).map((id) => ({ id, location: { type: LocationType.MilitaryVictoryDeck } }))
    )
    this.material(MaterialType.MilitaryVictoryToken).shuffle()
  }

  /**
   * With ClanSelection.Free, the platform hands each player the clan they picked as their identity
   */
  clansPicked(options: LedaOptions) {
    return options.clanSelection === ClanSelection.Free && Array.isArray(options.players) && options.players.every((player) => player.id !== undefined)
  }

  /**
   * Setup step 5 gives the first player. The website already hands the players over in a random order,
   * so the first of them starts. Not when they hold identities, which come in the order of the clans: they are shuffled.
   *
   * When the clans were picked before the game, each player takes theirs in turn order exactly as at the table,
   * through the same moves, which leaves the game at the mulligan.
   */
  start(options: LedaOptions) {
    const clansPicked = this.clansPicked(options)
    if (clansPicked) this.game.players = shuffle(this.game.players)
    this.startPlayerTurn(RuleId.ChooseClan, this.players[0])
    if (clansPicked) {
      for (const player of this.players) {
        this.playMove(MaterialMoveBuilder.customMove(CustomMoveType.ChooseClan, player as Clan))
      }
    }
  }
}
