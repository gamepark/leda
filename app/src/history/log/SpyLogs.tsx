import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { MoveItem } from '@gamepark/rules-api'
import { LogText } from '../LogText'
import { MaterialLink } from '../MaterialLink'
import { materialImage, revealedId } from '../logMaterial'

/**
 * A Spy effect: the player looks in secret at the first item of a pile, then puts it back on top of it or under it
 * (see {@link SpyRule}).
 *
 * What was seen is a secret of the table, and the journal keeps it exactly as the table does: whoever the look was
 * shown to reads the item in their log, and everybody else reads that a look happened and on which pile. That is
 * the whole of the effect, so a journal that told it to both players would be giving the effect away.
 *
 * Which of the 2 sentences is written is not decided by comparing anyone to anyone: it is decided by whether the
 * item has a face to draw at all, on the state this reader replayed. Their own client hid what they were not shown
 * and hid nothing once the game was over, so a player reading a finished game reads every look that was made,
 * theirs and their opponent's alike (see {@link materialImage}, {@link revealedId}).
 */

/** Which pile is being looked into, read off the type of the item: each pile holds one (see {@link spiedPiles}). */
const pileCodes: Partial<Record<MaterialType, string>> = {
  [MaterialType.ClanCard]: 'deck',
  [MaterialType.ActionTile]: 'action-tile',
  [MaterialType.MilitaryVictoryToken]: 'military-victory'
}

/** The type of an item is only ever numbered in a move, so the table above is reached through a typed door. */
const pileCode = (type: MaterialType): string | undefined => pileCodes[type]

/** The player takes the first item of a pile, which is what shows it to them alone. */
export const SpyLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(move.location.player)
  const item = new LedaRules(context.game).material(move.itemType).getItem(move.itemIndex)
  const pile = pileCode(move.itemType)
  if (pile === undefined) return null
  const id = revealedId(move, item)
  if (materialImage(move.itemType, id) === undefined) return <LogText code={`log.spy.${pile}`} values={{ player }} />
  return (
    <LogText code={`log.spy.${pile}-seen`} values={{ player }} components={{ material: <MaterialLink type={move.itemType} item={{ id }} /> }} />
  )
}

/**
 * The item goes back where it came from, on top of its pile or under it. Under is x 0, which is the far end of a
 * pile and pushes the whole of it up one (see {@link putBackMoves}).
 *
 * Nothing is revealed here: the item is read off the state it is being taken from, where its face is open to the
 * player who was looking at it and to nobody else.
 */
export const SpyReturnLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const item = new LedaRules(context.game).material(move.itemType).getItem(move.itemIndex)
  const player = usePlayerName(item?.location.player)
  const where = move.location.x === 0 ? 'under' : 'on-top'
  if (materialImage(move.itemType, item?.id) === undefined) return <LogText code={`log.spy-return.${where}`} values={{ player }} />
  return <LogText code={`log.spy-return.${where}-seen`} values={{ player }} components={{ material: <MaterialLink type={move.itemType} item={item} /> }} />
}
