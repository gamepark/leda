import { LedaRules } from '@gamepark/leda/LedaRules'
import { victorySymbols } from '@gamepark/leda/rules/militaryConflict'
import { playerClan } from '@gamepark/leda/rules/specialActivation'
import { gameWinner, hasSpecialVictory, specialVictoryProgress } from '@gamepark/leda/rules/victory'
import { usePlayerId, usePlayerName, useResultText, useRules } from '@gamepark/react-game'
import { HelpText } from '../material/helpLayout'

/**
 * What the header, and the result popup under it, say once the game is over: not only who won, but the race they
 * won and the count they won it on, which is the one thing the table no longer shows by itself (see {@link victory}).
 *
 * Read off the final state, exactly like every other text of this game: a game reopened later says what it said
 * when it closed, and a condition the rules stop using cannot leave a sentence claiming it was met.
 *
 * The framework sentence is kept for whatever ends a game without anybody meeting a condition, a player leaving
 * being one: there is no reason to give then, only a winner to name.
 */
export const GameOverHeader = () => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  const winner = rules === undefined ? undefined : gameWinner(rules)
  const player = usePlayerName(winner)
  const resultText = useResultText()
  if (rules === undefined || winner === undefined) return <>{resultText}</>
  const clan = playerClan(rules, winner)
  const special = specialVictoryProgress(rules, winner)
  /**
   * The victory of the clan first when both are met at once, which one move can do: it is the race the 2 players
   * were not running in the same way, and the one their whole grid was built for.
   */
  const victory =
    hasSpecialVictory(rules, winner) && clan !== undefined && special !== undefined
      ? { code: `game-over.clan.${clan}`, count: special.count }
      : { code: 'game-over.military', count: victorySymbols(rules, winner) }
  return <HelpText code={`${victory.code}.${winner === me ? 'you' : 'player'}`} values={{ player, count: victory.count }} />
}
