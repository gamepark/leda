import { HeaderText } from '@gamepark/react-game'
import { AwakeningIcon } from './AwakeningIcon'

/**
 * An Awakening is answered on the table, by dragging a Panda from the hand onto the square of a lesser one, so the
 * header only says what is expected. Nothing else may be done with it: the player chose it over the Food when they
 * activated the square, and that choice was final.
 */
export const AwakeningHeader = () => <HeaderText code="awakening" components={{ awakening: <AwakeningIcon /> }} />
