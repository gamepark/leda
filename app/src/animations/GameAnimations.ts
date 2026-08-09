import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { spiedPiles } from '@gamepark/leda/rules/spy'
import { MaterialAnimationContext, MaterialGameAnimations } from '@gamepark/react-game'
import { isCreateItemType, isMoveItem, MaterialMove } from '@gamepark/rules-api'
import { underPileApproach } from '../locators/Locators'

export const gameAnimations = new MaterialGameAnimations<number, MaterialType, LocationType>()

type Context = MaterialAnimationContext<number, MaterialType, LocationType>

/**
 * Half the second an animation takes by default, for the small things the game repeats over and over: a tile or a
 * card turning over, and a Food taken from the reserve. They punctuate a turn rather than being what it is about,
 * and at full length they make the resolution of an effect feel like it is being spelled out.
 */
const shortAnimation = 500

/**
 * A move that puts an item back under the pile it came from: the second of the 2 moves a Spy effect offers (see
 * putBackMoves), the Ring cards paid for a Military Victory token (see SpendRingForTokenRule), and the token a
 * Shark pack sends back (see RedrawMilitaryVictoryRule).
 * The 3 piles of the game are listed in spiedPiles, each with the type of the material it holds, and the bottom
 * of a pile is x 0 in all 3 of them.
 */
const goesUnderPile = (move: MaterialMove<number, MaterialType, LocationType>) =>
  isMoveItem(move) && move.location.x === 0 && spiedPiles.some(({ type, pile }) => type === move.itemType && pile === move.location.type)

/**
 * Such an item is laid flat on the table next to its pile before it lands, and the last thing it does is slide
 * under it: a straight line to where it ends would have it vanish behind the pile with nothing saying whether it
 * went under or on top, which is the whole of what the player is choosing. It travels at table level rather than
 * over the pile for the same reason (see {@link underPileApproach} for where it comes in from), and it arrives
 * below every item of the pile, so that they cover it as it slides in.
 */
gameAnimations.configure(goesUnderPile).trajectory((context, move) => ({
  elevation: false,
  waypoints: [{ at: 0.7, coordinates: underPileApproach(move, context) }]
}))

/**
 * An item turned over where it lies: a tile changing face, whether it becomes a Desert, is turned back onto its
 * front, or is upgraded and downgraded, and a Cat card taking the half turn that swaps which of its 2 effects is
 * up (see {@link rotateCard}).
 * All of them are moves that change nothing but the rotation of the location, which is what the face up is
 * written in, so that is what they are read by: a tile carried to another square by an organisation swap keeps
 * the face it shows, and is left alone. The state the animation runs against is the one before the move, hence
 * the rotation the item is still showing being the one compared to.
 */
const turnsOver = (move: MaterialMove<number, MaterialType, LocationType>, context: Context): boolean => {
  if (!isMoveItem(move) || (move.itemType !== MaterialType.Tile && move.itemType !== MaterialType.ClanCard)) return false
  const item = context.rules.material(move.itemType).getItem(move.itemIndex)
  return item !== undefined && (move.location.rotation === true) !== (item.location.rotation === true)
}

gameAnimations.configure(turnsOver).duration(shortAnimation)

/**
 * A Food gained, which is created rather than moved: the reserve holds no item, and the token flies in from where
 * the app draws it (see {@link FoodTokenDescription}). Spending one is left alone: it is the price of something,
 * and it reads better paid at full length.
 */
gameAnimations.configure(isCreateItemType(MaterialType.FoodToken)).duration(shortAnimation)
