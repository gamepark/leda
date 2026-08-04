import { HeaderText } from '@gamepark/react-game'

/**
 * A Cat card copying one of the cards its owner's opponent has in the zone of the round. The card is picked on the
 * table, on the opponent's own grid, and nothing of theirs is spent or turned over (see {@link CopyOpponentCardRule}).
 */
export const CopyOpponentCardHeader = () => <HeaderText code="copy-opponent-card" />
