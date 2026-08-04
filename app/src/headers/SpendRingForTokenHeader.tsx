import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { HeaderText } from '@gamepark/react-game'
import { isCustomMoveType } from '@gamepark/rules-api'

/**
 * A Cat card offering to trade a Ring of the hand for a Military Victory token. The Ring is given on the table, by
 * dragging it onto the deck, so the header only says what is on offer.
 * Turning it down has nowhere else to be said, hence the button (see {@link SpendRingForTokenRule}).
 */
export const SpendRingForTokenHeader = () => <HeaderText code="spend-ring-for-token" moves={{ decline: isCustomMoveType(CustomMoveType.Pass) }} />
