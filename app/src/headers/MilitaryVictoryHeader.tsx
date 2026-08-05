import { HeaderText } from '@gamepark/react-game'

/**
 * Drawing the top Military Victory token, which the rule does on its own: nothing is ever asked of the player
 * here, so the text only says what is happening while the token flies to them and its effect resolves.
 */
export const MilitaryVictoryHeader = () => <HeaderText code="military-victory" />
