import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { FlatMaterialDescription } from '@gamepark/react-game'
import { Material } from '../material/Material'

/** What a log entry has to know about a piece before it can name it: whether it may be drawn (see {@link revealedId}). */

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
