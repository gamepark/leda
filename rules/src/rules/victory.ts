import { XYCoordinates } from '@gamepark/rules-api'
import { Clan } from '../Clan'
import { ClanCardItemId } from '../material/ClanCardId'
import { isRing } from '../material/clanCards/catCards'
import { PandaLevel } from '../material/clanCards/PandaLevel'
import { isPortal } from '../material/clanCards/scorpionCards'
import { gridCorners } from '../material/PlayerGrid'
import { Rules } from '../Rules'
import { pandaLevel } from './awakening'
import { victorySymbols } from './militaryConflict'
import { placedSharkTokens, sharkTokens } from './sharkPack'
import { playerClan } from './specialActivation'
import { topCardOn, visibleCards } from './squares'

/**
 * How a game of LEDA is won. Both players run 2 races at once: the military victory, counted on the Military
 * Victory tokens they have won, and the special victory of their own clan, which no other clan can score. Their
 * Victory condition card prints both, so neither race is quite the same for the 2 players.
 *
 * Either of them ends the game the moment it is met, in the middle of whatever was being played
 * (see {@link LedaRules.afterItemMove}): nothing here waits for the end of a round.
 */

/**
 * The Victory symbols that win the military victory, which is not the same race for both players: the number is
 * printed on the Victory condition card of the clan, next to its special victory, and is what balances the two
 * against each other. A token is worth 1 symbol and one kind is worth 2, so a clan reaches its number on that
 * many tokens at the latest (see {@link victorySymbols}).
 */
export const victorySymbolsToWin: Record<Clan, number> = {
  [Clan.Scorpion]: 6,
  [Clan.Panda]: 7,
  [Clan.Cat]: 8,
  [Clan.Shark]: 9
}

/** How many of their 4 Rings the Cats have to have in play. */
export const ringsToWin = 3

/** How many Gold Pandas the Pandas have to have in play: the King and the Queen, and there is one of each. */
export const goldPandasToWin = 2

/**
 * How far along one of the 2 races a player is, and how far they have to go. Counted rather than answered yes or
 * no, so that the panel of a player can show them their progress and the rules read the same numbers it does
 * (see {@link PlayerPanels}).
 */
export type VictoryProgress = { count: number; goal: number }

/** Whether a race is run: the count has reached the goal. */
const isWon = (progress?: VictoryProgress): boolean => progress !== undefined && progress.count >= progress.goal

/**
 * The military victory: the Victory symbols of the tokens won during the conflicts, added up, against the number
 * the clan of the player has to reach. Undefined while they have no clan, which is only true of the setup.
 */
export const militaryVictoryProgress = (rules: Rules, player: number): VictoryProgress | undefined => {
  const clan = playerClan(rules, player)
  return clan === undefined ? undefined : { count: victorySymbols(rules, player), goal: victorySymbolsToWin[clan] }
}

export const hasMilitaryVictory = (rules: Rules, player: number): boolean => isWon(militaryVictoryProgress(rules, player))

/**
 * What each clan counts towards its own victory, read off its Victory condition card.
 *
 * Every one of them counts what the player has face up on their grid, at most one card per square: a card covered
 * by another is out of sight and out of play (see {@link visibleCards}). So a clan that buries its own win
 * condition under a card loses it, exactly as it loses what that card gave.
 */
const specialVictoryCounts: Record<Clan, (rules: Rules, player: number) => number> = {
  /** The Gold Pandas in play: the King and the Queen, which only Awakenings bring onto the grid. */
  [Clan.Panda]: (rules, player) => visibleCards(rules, player).id<ClanCardItemId>((id) => pandaLevel(id.front) === PandaLevel.Gold).length,

  /**
   * The supply of the clan placed on the grid: 9 tokens for 16 squares.
   * Counted on the tokens that are out rather than on the supply that is empty, which every other clan's is
   * (see {@link sharkTokens}).
   */
  [Clan.Shark]: (rules, player) => placedSharkTokens(rules, player).getQuantity(),

  /** The Rings in play, whichever they are. */
  [Clan.Cat]: (rules, player) => visibleCards(rules, player).id<ClanCardItemId>((id) => isRing(id.front)).length,

  /** The Portals standing in a corner of the grid, which a swap of 2 squares is another way of reaching. */
  [Clan.Scorpion]: (rules, player) => gridCorners.filter((corner) => isPortalOn(rules, player, corner)).length
}

/** How many of them each clan needs, which is all there is of the material in every case but the Rings. */
export const specialVictoryGoals: Record<Clan, number> = {
  [Clan.Panda]: goldPandasToWin,
  [Clan.Shark]: sharkTokens,
  [Clan.Cat]: ringsToWin,
  [Clan.Scorpion]: gridCorners.length
}

const isPortalOn = (rules: Rules, player: number, cell: XYCoordinates): boolean => {
  const card = topCardOn(rules, player, cell)
  return card !== undefined && isPortal(card)
}

/**
 * The special victory of the clan a player took. Undefined while they have no clan, which is only true of the
 * setup: a clan is picked before anything of it exists (see {@link ChooseClanRule}).
 */
export const specialVictoryProgress = (rules: Rules, player: number): VictoryProgress | undefined => {
  const clan = playerClan(rules, player)
  return clan === undefined ? undefined : { count: specialVictoryCounts[clan](rules, player), goal: specialVictoryGoals[clan] }
}

export const hasSpecialVictory = (rules: Rules, player: number): boolean => isWon(specialVictoryProgress(rules, player))

/** Whether a player has won, either way: nothing tells the 2 victories apart once the game is over. */
export const hasWon = (rules: Rules, player: number): boolean => hasMilitaryVictory(rules, player) || hasSpecialVictory(rules, player)

/**
 * The player who has won, if any. Only ever one: the game is closed as soon as a condition is met, so the second
 * player never gets to meet one of their own.
 */
export const gameWinner = (rules: Rules): number | undefined => rules.game.players.find((player) => hasWon(rules, player))
