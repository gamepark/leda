import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { DropAreaDescription, MaterialContext } from '@gamepark/react-game'
import { isMoveItem, Location, MaterialMove } from '@gamepark/rules-api'
import { DeckCounter } from './DeckCounter'
import { tileSize } from './TileDescription'

/**
 * The deck of a player as a location of the table. It draws nothing of its own: a pile is the cards it holds, and
 * this spot is only here to carry the count of the cards left in it (see {@link DeckCounter}).
 * It is the size of a card so that its corners are the corners of the pile, which is what the counter is placed
 * against.
 *
 * Being always on the table, it is also the spot a card given to the pile is dropped onto, hence a drop area and
 * not a plain location: the framework draws one area per spot, and the far end of the pile, x 0, which every such
 * move ends on, falls inside this one rather than getting an area of its own.
 */
export class PlayerDeckDescription extends DropAreaDescription<number, MaterialType, LocationType> {
  width = tileSize
  height = tileSize
  borderRadius = 0.5

  content = DeckCounter

  /**
   * Everything the deck takes is dragged onto it: a price paid in cards (see {@link PayCardCostRule}) and a Ring
   * traded for a token (see {@link SpendRingForTokenRule}) both leave the hand this way.
   *
   * All but what a Spy holds: an item taken from a pile goes back either on top of it or under it, and both of
   * these end on this one spot, which nothing here could tell apart. They are made with the buttons the item
   * carries instead, each naming its own end of the pile (see {@link SpiedItemButtons}), so the spot stays out of
   * it rather than lighting up for a choice it cannot express.
   */
  isMoveToLocation(
    move: MaterialMove<number, MaterialType, LocationType>,
    location: Location<number, LocationType>,
    context: MaterialContext<number, MaterialType, LocationType>
  ) {
    if (isMoveItem(move) && context.rules.material(move.itemType).getItem(move.itemIndex)?.location.type === LocationType.SpiedItem) return false
    return super.isMoveToLocation(move, location, context)
  }
}
