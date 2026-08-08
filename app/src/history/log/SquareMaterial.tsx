import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { tileAt } from '@gamepark/leda/material/PlayerGrid'
import { topCardIndexOn } from '@gamepark/leda/rules/squares'
import { XYCoordinates } from '@gamepark/rules-api'
import { MaterialLink } from '../MaterialLink'

/**
 * What a square of a grid holds, as the piece a log entry names: the card played on it, or its tile when no card
 * covers it, which is the very question activating a square asks (see {@link cardEffectsOn}).
 *
 * `card` is false for what only ever reaches a tile, a Cat card activating one for instance: a square holding a
 * card is out of the reach of those effects, so the tile under it is what is being named and not the card.
 */
export const SquareMaterial = ({ rules, player, cell, card = true }: { rules: LedaRules; player: number; cell: XYCoordinates; card?: boolean }) => {
  const cardIndex = card ? topCardIndexOn(rules, player, cell) : undefined
  if (cardIndex !== undefined) return <MaterialLink type={MaterialType.ClanCard} item={rules.material(MaterialType.ClanCard).getItem(cardIndex)} />
  const tile = tileAt(rules.material(MaterialType.Tile), player, cell).getItem()
  return <MaterialLink type={MaterialType.Tile} item={tile} flipped={tile?.location.rotation === true} />
}
