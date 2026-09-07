import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { spiedPiles } from '@gamepark/leda/rules/spy'
import { MaterialAnimationContext, MaterialGameAnimations } from '@gamepark/react-game'
import { isCreateItemType, isMoveItem, MaterialMove } from '@gamepark/rules-api'
import { revealedCardLocator, underPileApproach } from '../locators/Locators'

export const gameAnimations = new MaterialGameAnimations<number, MaterialType, LocationType>()

type Context = MaterialAnimationContext<number, MaterialType, LocationType>

/**
 * Under a third of the second an animation takes by default, for the small things the game repeats over and over,
 * often several in a row: a tile or a card turning over, and a Food taken from the reserve. They punctuate a turn
 * rather than being what it is about, so they have to be over as soon as they have been read.
 */
const shortAnimation = 300

/**
 * The card 2 of the Cat cards show both players before it goes where it is going: the Ring a search takes out of a
 * deck, on its way to the hand of its owner, and the Ring traded for a Military Victory token, on its way under
 * their deck (see {@link LocationType.RevealedCard}).
 *
 * Half a second to reach the spot above their deck, a second standing still on it, and half a second to leave.
 */
const revealTravel = 500
const revealPause = 1000
const revealDuration = revealPause + revealTravel

/** How far into the animation of a card leaving the spot it is still standing on it. */
const revealHold = revealPause / revealDuration

/** Reaching the spot, which is the first of the 2 moves and a journey and nothing else. */
const goesToRevealSpot = (move: MaterialMove<number, MaterialType, LocationType>) =>
  isMoveItem(move) && move.location.type === LocationType.RevealedCard

gameAnimations.configure(goesToRevealSpot).duration(revealTravel)

/**
 * Leaving it, which is the same half second spent after the card has stood still for the pause: the trajectory
 * holds it on the spot until the last third of the animation, and only then takes it to its destination.
 *
 * Held by the locator of the spot rather than by its coordinates, which is what keeps it standing straight: a
 * waypoint of coordinates only pins where the card is, where every rotation of a move is spread over the whole of
 * it, so the card would spend the pause tilting into the fan of the hand it is going to. A waypoint of a locator
 * is the whole pose the spot gives a card, rotation included (see `Locator.placeItem`).
 *
 * A Ring going back under a deck spends its half second the way every other card put back under one does, sliding
 * in from below rather than vanishing behind the pile (see {@link underPileApproach}), the waypoint of that
 * approach placed the same 0.7 of the way into what is left of the animation.
 *
 * Hence this coming before the under-pile trajectory below, which matches that very move: a move is animated with
 * the first configuration that matches it.
 */
const leavesRevealSpot = (move: MaterialMove<number, MaterialType, LocationType>, context: Context) =>
  isMoveItem(move) && context.rules.material(move.itemType).getItem(move.itemIndex)?.location.type === LocationType.RevealedCard

gameAnimations
  .configure(leavesRevealSpot)
  .duration(revealDuration)
  .trajectory((context, move) => {
    // Always the move of an item, that being what the configuration above matches: TypeScript is what needs telling.
    if (!isMoveItem(move)) return {}
    const player = context.rules.material(move.itemType).getItem(move.itemIndex)?.location.player
    const held = { at: revealHold, locator: revealedCardLocator, location: { type: LocationType.RevealedCard, player } }
    if (move.location.type !== LocationType.PlayerDeck) return { elevation: false, waypoints: [held] }
    return { elevation: false, waypoints: [held, { at: revealHold + (1 - revealHold) * 0.7, coordinates: underPileApproach(move, context) }] }
  })

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
