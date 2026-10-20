import { LedaRules } from '@gamepark/leda/LedaRules'
import { gameWinner } from '@gamepark/leda/rules/victory'
import { useRules, useSound } from '@gamepark/react-game'
import { useEffect, useRef } from 'react'
import VictorySoundFile from './victory.mp3'

/**
 * The fanfare of a victory, heard once, when the move that wins the game lands under the eyes of the players. The
 * same for the military victory and for every clan victory: either race ends the game the moment it is run.
 *
 * Watched on the state rather than configured on a move, for the same reason as {@link MilitarySymbolSound}: the
 * move that ends the game is whatever move met the condition, and the game over is not a move that is animated.
 * Read off the displayed state, so it is heard when the winning move arrives and not when the server settled it.
 *
 * Only on the switch to over: a finished game reopened later, or reloaded, is shown over from its first state,
 * which is only recorded. And only when somebody won: a game ended by a player leaving has no fanfare to play.
 */
export const VictorySound = () => {
  const rules = useRules<LedaRules>()
  const sound = useSound(VictorySoundFile)
  sound.volume = 0.5

  const won = rules === undefined ? undefined : rules.isOver() && gameWinner(rules) !== undefined

  const previous = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    if (won === undefined) return
    const before = previous.current
    previous.current = won
    if (before !== false || !won) return
    sound.currentTime = 0
    // Rejected when the browser has not been given a gesture to play on yet, which is not worth a stack trace.
    sound.play().catch(() => {})
  }, [won, sound])

  return null
}
