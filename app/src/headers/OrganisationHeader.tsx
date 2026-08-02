import { HeaderText } from '@gamepark/react-game'
import { FoodIcon } from './FoodIcon'

/**
 * The first half of an organisation: the player plays a card, or takes the Food that comes with a swap.
 * Both are answered on the table, on the cards and the squares themselves and on the button beside the reserve
 * (see {@link TakeOrganisationFoodButton}), so the header only says what is expected of them.
 *
 * It names what a swap is worth rather than what the button does: the Food is offered before the swap only to
 * have somewhere to say it (see {@link OrganisationRule}), which the player has no reason to read.
 */
export const OrganisationHeader = () => <HeaderText code="organisation" components={{ food: <FoodIcon /> }} />
