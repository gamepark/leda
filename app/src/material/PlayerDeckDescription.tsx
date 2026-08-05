import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { LocationDescription } from '@gamepark/react-game'
import { DeckCounter } from './DeckCounter'
import { tileSize } from './TileDescription'

/**
 * The deck of a player as a location of the table. It draws nothing of its own: a pile is the cards it holds, and
 * this spot is only here to carry the count of the cards left in it (see {@link DeckCounter}).
 * It is the size of a card so that its corners are the corners of the pile, which is what the counter is placed
 * against.
 */
export class PlayerDeckDescription extends LocationDescription<number, MaterialType, LocationType> {
  width = tileSize
  height = tileSize

  content = DeckCounter

  /**
   * The spot is a number laid over the pile, not a place to drop a card onto. Without this the framework would
   * read every move that ends on the deck, a spied card put back or a Ring card paid, as a move onto the spot,
   * and light it up as one more thing to click next to the buttons that already offer these moves.
   */
  isMoveToLocation() {
    return false
  }
}
