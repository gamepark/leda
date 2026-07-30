import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { TokenDescription } from '@gamepark/react-game'
import SharkTokenImage from '../images/tokens/shark.png'

export const sharkTokenWidth = 2.4

/**
 * The 9 Shark tokens, only in play when a player took the Shark clan.
 * Unlike the Food, their number is a rule of the game: placing the last one wins.
 */
export class SharkTokenDescription extends TokenDescription<number, MaterialType, LocationType> {
  width = sharkTokenWidth
  ratio = 388 / 359
  transparency = true
  image = SharkTokenImage
}
