import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { HeaderText } from '@gamepark/react-game'
import { isCustomMoveType } from '@gamepark/rules-api'

/**
 * HeaderText picks header.mulligan.you, .player or .players depending on who is still to decide, and turns the moves
 * below into buttons placed by the <keep> and <redraw> tags of the translation.
 */
export const MulliganHeader = () => (
  <HeaderText
    code="mulligan"
    moves={{
      keep: isCustomMoveType(CustomMoveType.KeepStartingHand),
      redraw: isCustomMoveType(CustomMoveType.Mulligan)
    }}
  />
)
