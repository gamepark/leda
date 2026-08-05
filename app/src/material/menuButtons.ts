import { LedaRules } from '@gamepark/leda/LedaRules'
// DisplayedAction is a type the framework re-exports from its store, and only a type: hence the modifier.
import { type DisplayedAction, useActions, usePlayerId, useRules } from '@gamepark/react-game'

/**
 * What a button of an item reads to know what it offers: the state of the game, and who is looking at it.
 * Undefined when there is nothing any button could offer, either because nobody is playing (a spectator), or
 * because the table has not caught up with what has been played yet (see {@link tableIsLate}).
 *
 * Read through the hooks rather than through the context handed to the material description: an item is only
 * re-rendered when its own item changes, which is far from every time its buttons have to change.
 * Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
 */
export const useMenuButtonRules = (): { rules: LedaRules; player: number } | undefined => {
  const rules = useRules<LedaRules>()
  const player = usePlayerId<number>()
  const actions = useActions()
  if (!rules || player === undefined || actions === undefined || actions.some(tableIsLate)) return undefined
  return { rules, player }
}

/**
 * Whether this action has anything left to show. A move is played on the state at once and shown one animation at
 * a time, so from the click that plays one until its last consequence has landed, what the table shows is behind
 * what the next move is checked against: a button read off a state that late offers a move the rules have already
 * moved past, and pressing it fails with "this move is not authorized right now".
 *
 * The 3 ways an action can be ahead of the table: it is waiting for the server to say what it did, because the
 * client could not tell (delayed); it is being played, and some of its moves are still to be shown; or it is being
 * undone, and some of its moves are still to be taken back.
 */
const tableIsLate = (action: DisplayedAction) =>
  action.delayed === true || (action.cancelled ? action.played > 0 : action.played <= action.consequences.length)
