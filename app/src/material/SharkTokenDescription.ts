import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { TokenDescription } from '@gamepark/react-game'
import SharkTokenImage from '../images/tokens/shark.png'
import { SharkTokenHelp } from './SharkTokenHelp'

const sharkTokenRatio = 388 / 359

/** The Shark token. */
export const sharkToken = {
  width: 3,
  height: 3 / sharkTokenRatio
}

/**
 * The 9 Shark tokens, only in play when a player took the Shark clan.
 * Unlike the Food, their number is a rule of the game: placing the last one wins.
 */
export class SharkTokenDescription extends TokenDescription<number, MaterialType, LocationType> {
  width = sharkToken.width
  ratio = sharkTokenRatio
  transparency = true
  image = SharkTokenImage

  /** Clicking a token opens what it does to the card under it, and what the 9th one wins (see {@link SharkTokenHelp}). */
  help = SharkTokenHelp
}
