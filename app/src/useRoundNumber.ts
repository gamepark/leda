import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { useActions } from '@gamepark/react-game'
import { isMoveItemType, MaterialMove } from '@gamepark/rules-api'

/**
 * The number of the round being played, or of the last one once the game is over, counted in the actions played:
 * each round opens on an Action tile turned face up (see {@link RevealActionTileLog}), which is always a consequence
 * of a player's move, the first one included. 0 while the players are still picking their clans.
 */
export const useRoundNumber = (): number => {
  const actions = useActions<MaterialMove>()
  return (
    actions?.reduce(
      (count, action) => (action.cancelled ? count : count + [action.move, ...action.consequences].filter(isActionTileReveal).length),
      0
    ) ?? 0
  )
}

const isActionTileReveal = (move: MaterialMove) =>
  isMoveItemType(MaterialType.ActionTile)(move) && move.location.type === LocationType.ActionTileRevealed
