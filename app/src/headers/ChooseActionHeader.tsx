import { HeaderText } from '@gamepark/react-game'

/**
 * The active player picks one of the zones the Action tile offers, on the button that zone carries on their grid
 * (see {@link ChooseZoneButton}). There is nothing to validate afterwards, so the header only says what to do.
 */
export const ChooseActionHeader = () => <HeaderText code="choose-action" />
