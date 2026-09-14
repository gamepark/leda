import { militaryVictoryTokenQuantities, MilitaryVictoryTokenId, militaryVictoryTokens } from '../material/MilitaryVictoryTokenId'
import { Rules } from '../Rules'
import { Memory } from './Memory'

/**
 * Whether the game is played with the tournament rules (see {@link LedaOptions}), which the setup wrote down since
 * the rules never see the options again. Read on the game rather than through a rule, so the app answers it the same way.
 */
export const playsTournamentRules = (rules: Rules): boolean => rules.game.memory[Memory.TournamentRules] === true

/** How many copies of a token the pile holds: the tournament rules leave the tokens worth 2 Victory symbols in the box. */
export const militaryVictoryTokenCopies = (token: MilitaryVictoryTokenId, tournamentRules: boolean): number =>
  tournamentRules && token === MilitaryVictoryTokenId.DoubleVictory ? 0 : militaryVictoryTokenQuantities[token]

/** The tokens shuffled into the pile, 18 of them, or 16 with the tournament rules. */
export const militaryVictoryPile = (tournamentRules: boolean): MilitaryVictoryTokenId[] =>
  militaryVictoryTokens.filter((token) => militaryVictoryTokenCopies(token, tournamentRules) > 0)
