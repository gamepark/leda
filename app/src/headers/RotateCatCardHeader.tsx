import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { HeaderText } from '@gamepark/react-game'
import { isCustomMoveType } from '@gamepark/rules-api'

/**
 * What a Ring gives: turning one of the player's Cat cards onto its other effect. The card is picked on the table,
 * on the card itself, and turning none is a choice of its own, hence the button (see {@link RotateCatCardRule}).
 */
export const RotateCatCardHeader = () => <HeaderText code="rotate-cat-card" moves={{ decline: isCustomMoveType(CustomMoveType.Pass) }} />
