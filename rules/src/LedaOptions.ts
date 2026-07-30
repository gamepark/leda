import { OptionsSpec } from '@gamepark/rules-api'

/**
 * This is the type of object that the game receives when a new game is started.
 * Leda is a 2-player game with no variant: the players do not choose anything before the game starts.
 * The clan is not an option, it is picked during the game (see {@link Clan}), so players are simply numbered 1 and 2.
 */
export type LedaOptions = Record<string, never>

/**
 * This object describes all the options a game can have, and will be used by GamePark website to create automatically forms for you game
 * (forms for friendly games, or forms for matchmaking preferences, for instance).
 */
export const LedaOptionsSpec: OptionsSpec<LedaOptions> = {}
