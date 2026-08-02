import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { LocationDescription } from '@gamepark/react-game'
import { TakeOrganisationFoodButton } from './TakeOrganisationFoodButton'

/**
 * The Food reserve as a location of the table rather than as material: it holds no item of the game state, only
 * the fixed pile the Food description displays (see {@link FoodTokenDescription}).
 * It exists to carry the button that takes the Food of an organisation, which has to sit beside the reserve and
 * has no item of its own to hang on: the pile is 20 copies of one item, and a menu would be drawn on each.
 * Hence the size of nothing: the location is a spot, and the button is all there is to see.
 */
export class FoodSupplyDescription extends LocationDescription<number, MaterialType, LocationType> {
  /** A size of its own would have to be given a width and a height, which a spot has neither of. */
  getSize() {
    return { width: 0, height: 0 }
  }

  content = TakeOrganisationFoodButton

  /** No help dialog: the reserve is not material, and the button inside is the only thing to click here. */
  displayHelp = () => undefined
}
