import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialItem, MoveItem } from '@gamepark/rules-api'

/**
 * What the move says the item is, for a reader it reveals it to, and what the state already said for everybody
 * else: a card leaving a deck is only revealed to the player drawing it, and a token leaving the pile to all.
 *
 * A composite id is completed rather than replaced: hiding a clan card takes its front away and leaves its back,
 * so what a move reveals of one is the front alone (see {@link ClanCardItemId}).
 * Nothing is revealed at all once the game is over, the server having opened everything: the id of the item is
 * then already the whole of it.
 *
 * On its own, away from the pictures of the material it ends up drawn as (see {@link materialImage}): the buttons
 * of the table read it too, and a button that pulled the table of the descriptions in would have that table
 * waiting on the very descriptions it is made of (see {@link SpyHistoryButton}).
 */
export const revealedId = <Id,>(move: MoveItem<number, MaterialType, LocationType>, item?: Partial<MaterialItem<number, LocationType, Id>>): Id | undefined => {
  const revealed = move.reveal?.id as Id | undefined
  if (revealed === undefined) return item?.id
  if (typeof revealed !== 'object' || typeof item?.id !== 'object') return revealed
  return { ...item.id, ...revealed }
}
