import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { roundSpies, Spy } from '@gamepark/leda/rules/spy'
import { useActions, useRules } from '@gamepark/react-game'
import { Action, isMoveItem, MaterialMove, MoveItem } from '@gamepark/rules-api'
import { useMemo } from 'react'
import { revealedId } from './revealedId'

type Move = MaterialMove<number, MaterialType, LocationType>

/** The move a Spy is made with: taking the first item of a pile, which is what shows it (see {@link SpyRule}). */
type Look = MoveItem<number, MaterialType, LocationType>

/**
 * One action of the history: a move a player played, whatever followed from it, and whether it still counts.
 * The type of the framework carries more than this, and this is the whole of what a Spy is read out of.
 */
type PlayedAction = Action<Move, number> & { cancelled?: boolean; transient?: boolean }

/** A Spy of the round, with the item it looked at for the client it was shown to, and nothing for the others. */
export type SeenSpy = Spy & { seen?: unknown }

/**
 * The Spies of the round, each with what its player saw when this very client is the one it was shown to
 * (see {@link SpyHistoryDialog}).
 *
 * What was seen is not written down anywhere by the rules, and never will be: the memory of the game travels whole
 * to both players, so a card remembered there would be a card handed to the opponent. It is read out of the
 * history of the moves instead, which the server writes one copy of per player: the move taking the item off its
 * pile reveals what it is to the player making the Spy alone, exactly as it does in the journal
 * (see {@link SpyLog}).
 *
 * So a look is shown to whoever was already shown it, by the same server that hid it from the other, and the
 * client is left with nothing to decide.
 */
export const useRoundSpies = (): SeenSpy[] => {
  const rules = useRules<LedaRules>()
  const actions = useActions<Move, number>()
  return useMemo(() => (rules === undefined ? [] : seenSpies(rules, actions ?? [])), [rules, actions])
}

/**
 * The Spies of the round matched with the looks of the history, in the one order both are in: the rules write a
 * Spy down as the item goes back into its pile, so the last looks of the history are the Spies of the round.
 *
 * Matched rather than trusted: each look has to be on the pile and by the player the Spy it lands on says, and a
 * single one of them falling out of step gives up on the whole matching. A Spy shown next to the wrong item would
 * be worse than a Spy shown next to nothing.
 */
const seenSpies = (rules: LedaRules, actions: PlayedAction[]): SeenSpy[] => {
  const spies = roundSpies(rules)
  const looks = spyLooks(actions)
  const round = looks.slice(looks.length - spies.length)
  if (round.length < spies.length || spies.some((spy, index) => !isLookOf(round[index], spy))) return spies
  return spies.map((spy, index) => ({ ...spy, seen: seenId(rules, round[index]) }))
}

/**
 * Every look of the game that was seen through, in the order they were made.
 *
 * A look is over once the item it took is back in a pile, which is the move that follows it on that very item: a
 * Spy is 2 moves, and only the pair of them is a Spy of the round. That leaves out the look a player is in the
 * middle of making, which the rules have not written down yet and which nobody is waiting to read.
 *
 * An action that was undone, or one a client is only previewing, never happened.
 */
const spyLooks = (actions: PlayedAction[]): Look[] => {
  const looks: Look[] = []
  let open: Look | undefined
  for (const action of actions) {
    if (action.cancelled || action.transient) continue
    for (const move of [action.move, ...action.consequences]) {
      if (!isMoveItem(move)) continue
      if (move.location.type === LocationType.SpiedItem) {
        open = move
      } else if (open !== undefined && move.itemType === open.itemType && move.itemIndex === open.itemIndex) {
        looks.push(open)
        open = undefined
      }
    }
  }
  return looks
}

/** Whether a look is the one a Spy was made with: the pile it took from, and the player who took. */
const isLookOf = (look: Look, spy: Spy): boolean => look.itemType === spy.pile && look.location.player === spy.player

/**
 * What a look showed, and nothing at all when it showed this client nothing: the move only carries what the item
 * is for the player it was revealed to, everybody else having received the same move without it.
 *
 * Read off the move alone, and never off the item as it stands now: an Action tile turned face up since, or a card
 * played since, is open to everyone today, and pointing at the look that saw it back then would be telling the
 * opponent what a pile held and in which order, which is the whole of the effect.
 * The face of a clan card is completed with its back, which is the one half of it a deck never hid
 * (see {@link revealedId}).
 */
const seenId = (rules: LedaRules, look: Look): unknown => {
  if (look.reveal?.id === undefined) return undefined
  return revealedId(look, rules.material(look.itemType).getItem(look.itemIndex))
}
