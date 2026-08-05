import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { spiedPiles } from '@gamepark/leda/rules/spy'
import { MaterialGameAnimations } from '@gamepark/react-game'
import { isMoveItem, MaterialMove } from '@gamepark/rules-api'
import { underPileApproach } from '../locators/Locators'

export const gameAnimations = new MaterialGameAnimations<number, MaterialType, LocationType>()

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
