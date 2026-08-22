import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
// DisplayedAction is a type the framework re-exports from its store, and only a type: hence the modifier.
import { type DisplayedAction, useActions, usePlayerId, useRules } from '@gamepark/react-game'
import { isCustomMoveType, isMoveItemType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a button of an item reads to know what it offers: the state of the game, and who is looking at it.
 * Undefined when there is nothing any button could offer, either because nobody is playing (a spectator), or
 * because the table has not caught up with what has been played yet (see {@link tableIsLate}).
 *
 * Read through the hooks rather than through the context handed to the material description: an item is only
 * re-rendered when its own item changes, which is far from every time its buttons have to change.
 * The rules are the ones the table is showing, and the moves a button offers are read off them
 * (see {@link offeredCells}): the guard below is what keeps them in step with what has been played, which the
 * legal moves the store keeps are not while an animation is still running.
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

/**
 * The squares the rules are offering a move on right now, read off the moves they hand the player rather than
 * worked out a second time beside them (see {@link ActivateSquareButton}).
 *
 * Reading them off the moves is what keeps a button and what pressing it does the same thing: there is one button
 * exactly where there is one move, and never one more. The tutorial narrows the moves of a step down to the one it
 * is asking for, and every other button of the table goes away with them, so that what the reader is being told
 * to press is the only thing there is to press (see {@link LedaTutorial}).
 */
export const offeredCells = (rules: LedaRules, player: number, type: CustomMoveType): XYCoordinates[] =>
  rules
    .getLegalMoves(player)
    .filter(isCustomMoveType<CustomMoveType, XYCoordinates>(type))
    .map((move) => move.data)
    .filter((cell) => cell !== undefined)

/**
 * The move the rules are offering on a tile of a grid, if there is one, for the rules that offer one move per
 * tile: turning it over, one way or the other (see {@link UpgradeTileButton}).
 * The button plays the very move it was read from, so what it offers cannot drift from what the rules allow.
 */
export const offeredTileMove = (rules: LedaRules, player: number, tile: number): Move | undefined =>
  rules.getLegalMoves(player).find((move) => isMoveItemType(MaterialType.Tile)(move) && move.itemIndex === tile)
