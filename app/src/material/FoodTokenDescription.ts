import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { TokenDescription } from '@gamepark/react-game'
import FoodTokenImage from '../images/tokens/food.png'

/** Food has no id and no back: in the game state it only ever exists in front of a player. */
export class FoodTokenDescription extends TokenDescription<number, MaterialType, LocationType> {
  width = 1.9
  ratio = 317 / 359
  transparency = true
  image = FoodTokenImage

  /**
   * The reserve is not part of the game state, since it is unlimited (see MaterialType.FoodToken).
   * This pile of 20 exists in the app only: it never changes, whatever the players own.
   */
  staticItem = { location: { type: LocationType.FoodSupply }, quantity: 20 }

  /** Food a player gains or spends is animated from and to the reserve rather than fading in and out. */
  stockLocation = { type: LocationType.FoodSupply }
}
