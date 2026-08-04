import { HeaderText } from '@gamepark/react-game'

/**
 * The player turns one of their own tiles onto its worse face. What asks it of them is a Scorpion Portal their
 * opponent played, but the player being asked is the active one while it lasts, so the usual you/player split of
 * the header says the right thing to each of them with nothing to read here (see {@link DowngradeTileRule}).
 */
export const DowngradeTileHeader = () => <HeaderText code="downgrade-tile" />
