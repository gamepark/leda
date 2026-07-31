import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialContext } from '@gamepark/react-game'
import { Location } from '@gamepark/rules-api'

/** How far to the side of an item its Spy buttons sit: a clan card is wider than the items of the 2 other piles. */
export const spyButtonX = (type: MaterialType): number => (type === MaterialType.ClanCard ? 3 : 2)

/**
 * Whether an item a Spy effect took off a pile is being looked at by somebody else: it shows its face to the
 * player who took it, and its back to everyone else, the way a card held in hand does.
 * The material descriptions read this rather than the missing id, which comes back when the server reveals
 * everything at the end of the game.
 */
export const isSpiedByOther = (location: Partial<Location<number, LocationType>> | undefined, context: MaterialContext): boolean =>
  location?.type === LocationType.SpiedItem && context.player !== location.player
