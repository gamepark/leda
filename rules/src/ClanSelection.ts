/**
 * How players get their clan
 */
export enum ClanSelection {
  /** In turn order, at the table, once the game has started (see {@link ChooseClanRule}) */
  InGame = 1,
  /** Each player picks any clan before the game, as their player identity. Friendly games only (gated in the platform). */
  Free = 2
}
