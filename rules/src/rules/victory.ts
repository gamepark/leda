import { Clan } from '../Clan'
import { ClanCardId } from '../material/ClanCardId'
import { isRing } from '../material/clanCards/catCards'
import { isPortal } from '../material/clanCards/scorpionCards'
import { gridCells, gridCorners } from '../material/PlayerGrid'
import { Rules } from '../Rules'
import { victorySymbols } from './militaryConflict'
import { topCardOn } from './playedCards'
import { placedSharkTokens, sharkTokens } from './sharkPack'
import { playerClan } from './specialActivation'

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

/**
 * The military victory: the tokens won during the conflicts, added up, against the number the clan of the player
 * has to reach. False while they have no clan, as {@link hasSpecialVictory} is, and for the same reason.
 */
export const hasMilitaryVictory = (rules: Rules, player: number): boolean => {
  const clan = playerClan(rules, player)
  return clan !== undefined && victorySymbols(rules, player) >= victorySymbolsToWin[clan]
}

/**
 * The cards a player has face up on their grid, at most one per square: cards pile up on a square as they are
 * played, and one covered by another is out of sight and out of play (see {@link topCardOn}).
 * Every special victory below is read off these, so a clan that buries its own win condition under a card loses
 * it, exactly as it loses what that card gave.
 */
const visibleCards = (rules: Rules, player: number): ClanCardId[] =>
  gridCells.map((cell) => topCardOn(rules, player, cell)).filter((card): card is ClanCardId => card !== undefined)

/** What each clan wins with, read off its Victory condition card. */
const specialVictories: Record<Clan, (rules: Rules, player: number) => boolean> = {
  /** The 2 Gold Pandas in play: the King and the Queen, which only Awakenings bring onto the grid. */
  [Clan.Panda]: (rules, player) => {
    const cards = visibleCards(rules, player)
    return cards.includes(ClanCardId.PandaKing) && cards.includes(ClanCardId.PandaQueen)
  },

  /**
   * The whole supply of the clan placed on the grid: 9 tokens for 16 squares.
   * Counted on the tokens that are out rather than on the supply that is empty, which every other clan's is
   * (see {@link sharkTokens}).
   */
  [Clan.Shark]: (rules, player) => placedSharkTokens(rules, player).getQuantity() >= sharkTokens,

  /** 3 of the 4 Rings in play, whichever 3 they are. */
  [Clan.Cat]: (rules, player) => visibleCards(rules, player).filter(isRing).length >= ringsToWin,

  /** The 4 Portals in the 4 corners of the grid, which a swap of 2 squares is another way of reaching. */
  [Clan.Scorpion]: (rules, player) =>
    gridCorners.every((corner) => {
      const card = topCardOn(rules, player, corner)
      return card !== undefined && isPortal(card)
    })
}

/**
 * The special victory of the clan a player took. False while they have no clan, which is only true of the setup:
 * a clan is picked before anything of it exists (see {@link ChooseClanRule}).
 */
export const hasSpecialVictory = (rules: Rules, player: number): boolean => {
  const clan = playerClan(rules, player)
  return clan !== undefined && specialVictories[clan](rules, player)
}

/** Whether a player has won, either way: nothing tells the 2 victories apart once the game is over. */
export const hasWon = (rules: Rules, player: number): boolean => hasMilitaryVictory(rules, player) || hasSpecialVictory(rules, player)

/**
 * The player who has won, if any. Only ever one: the game is closed as soon as a condition is met, so the second
 * player never gets to meet one of their own.
 */
export const gameWinner = (rules: Rules): number | undefined => rules.game.players.find((player) => hasWon(rules, player))
