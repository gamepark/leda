import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { HeaderText } from '@gamepark/react-game'
import { isCustomMoveType } from '@gamepark/rules-api'

/**
 * The Rings a player of the Cats may put in play, each of them under a condition of its own. Which ones those are
 * is answered on the table, by dragging a Ring from the hand onto a square of the grid: the hand only offers the
 * ones whose condition is met (see {@link PlaceRingRule}).
 * Free is not compulsory, and turning it down has nowhere else to be said, hence the button.
 */
export const PlaceRingHeader = () => <HeaderText code="place-ring" moves={{ decline: isCustomMoveType(CustomMoveType.Pass) }} />
