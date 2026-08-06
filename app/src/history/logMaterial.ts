import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { FlatMaterialDescription } from '@gamepark/react-game'
import { MaterialItem, MoveItem } from '@gamepark/rules-api'
import { Material } from '../material/Material'

/** What a log entry has to know about a piece before it can name it: whether it may be drawn, and which one it is. */

/** A description of the game whose faces are pictures, which every piece of LEDA has. */
type Flat = FlatMaterialDescription<number, MaterialType, LocationType>

/**
 * The face of a piece, or undefined when nobody reading this may see it: a card whose front is hidden has a back
 * and no front, and the description answers with nothing rather than with the wrong image.
 *
 * That undefined is what the log entries read to know which of their 2 sentences to write: a Spy tells what was
 * seen to the player who looked, and that a look happened to everybody else (see {@link SpyLog}).
 */
export const materialImage = (type: MaterialType, id: unknown, flipped = false): string | undefined => {
  const description = Material[type] as Flat | undefined
  if (description === undefined || id === undefined) return undefined
  return flipped ? description.getBackImage(id) : description.getImage(id)
}

/**
 * What the move says the item is, for a reader it reveals it to, and what the state already said for everybody
 * else: a card leaving a deck is only revealed to the player drawing it, and a token leaving the pile to all.
 *
 * A composite id is completed rather than replaced: hiding a clan card takes its front away and leaves its back,
 * so what a move reveals of one is the front alone (see {@link ClanCardItemId}).
 * Nothing is revealed at all once the game is over, the server having opened everything: the id of the item is
 * then already the whole of it.
 */
export const revealedId = <Id,>(move: MoveItem<number, MaterialType, LocationType>, item?: Partial<MaterialItem<number, LocationType, Id>>): Id | undefined => {
  const revealed = move.reveal?.id as Id | undefined
  if (revealed === undefined) return item?.id
  if (typeof revealed !== 'object' || typeof item?.id !== 'object') return revealed
  return { ...item.id, ...revealed }
}
