import { LedaRules } from '@gamepark/leda/LedaRules'
import { militarySymbols } from '@gamepark/leda/rules/militaryConflict'
import { useRules, useSound } from '@gamepark/react-game'
import { useEffect, useRef } from 'react'
import SwordDrawnSound from './sword-drawn.wav'

/**
 * The blade coming out of its sheath, heard when a player gathers military symbols.
 *
 * Watched on the counter rather than configured on a move, because a military symbol is not a move: nothing is
 * created and nothing travels, the count is written into the memory of the game and read back when the conflict
 * is settled (see {@link Effect.Military}). The animation API only ever offers a sound to a move it animates, so
 * there is no move here to hang one on — and hanging it on the moves that lead to a gain would mean predicting,
 * on the state before each of them, what the effects they open are about to give. A dozen cards, the OR choices
 * and the tiles all reach the same counter, so the counter is what says the gain happened.
 *
 * Read off the displayed state, which is what the panels show and what the animations advance move by move: the
 * blade is heard when the number goes up under the eyes of the player, and not when the server settled it.
 *
 * Both players are watched. What is heard is a symbol gathered on the table, the way an opponent's card is heard
 * being played — and the conflict of the round is precisely the two counts against each other. Restricting it to
 * the player looking at the table is `usePlayerId()` and one comparison here.
 */
export const MilitarySymbolSound = () => {
  const rules = useRules<LedaRules>()
  const sound = useSound(SwordDrawnSound)
  sound.volume = 0.2

  // The whole of what the effect below compares, as a value it can depend on: an array is a new one on every
  // render, and the counts of the players in the order they play are one string.
  const gathered = rules?.game.players.map((player) => militarySymbols(rules, player)).join()

  // Undefined until the game is known, and the first known state is only recorded: a player reconnecting into a
  // round where symbols have already been gathered has not just gathered them.
  const previous = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (gathered === undefined) return
    const before = previous.current
    previous.current = gathered
    if (before === undefined) return
    // Only upwards, and one blade however many players went up at once. The count of every player is reset to 0
    // when the round hands out its zone (see {@link ChooseActionRule}), which is a drop and stays silent.
    const gains = gathered.split(',').map(Number)
    const gainsBefore = before.split(',').map(Number)
    if (!gains.some((symbols, player) => symbols > gainsBefore[player])) return
    sound.currentTime = 0
    // Rejected when the browser has not been given a gesture to play on yet, which is not worth a stack trace.
    sound.play().catch(() => {})
  }, [gathered])

  return null
}
