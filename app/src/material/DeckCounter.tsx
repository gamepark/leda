import { css } from '@emotion/react'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { useRules } from '@gamepark/react-game'
import { Location } from '@gamepark/rules-api'

/**
 * How many cards are left in the deck of a player, in the bottom right corner of the card on top of it.
 * The number belongs to the pile rather than to any of its cards, since the one it is read on changes as soon as
 * a card is drawn: it is laid on the spot of the deck, which is exactly where its cards are.
 */
export const DeckCounter = ({ location }: { location: Location<number, LocationType> }) => {
  const rules = useRules<LedaRules>()
  const count = rules?.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(location.player).length ?? 0
  if (count === 0) return null
  return (
    <span css={corner}>
      <span css={number}>{count}</span>
    </span>
  )
}

/**
 * The corner of the pile. No font size here, so that the inset stays in the units of the table and is read in
 * centimeters like everything else, and a lift above the cards of the pile, which the number is read over.
 */
const corner = css`
  position: absolute;
  right: 0.5em;
  bottom: 0.5em;
  transform: translateZ(1em);
`

/**
 * White in a black outline: the number is read over the back of a card, which is the emblem of a clan on the
 * colour of that clan, and the 4 of them are strong colours. paint-order draws the outline first, so that it
 * thickens the digits from the outside instead of eating into them.
 */
const number = css`
  display: block;
  font-size: 1.8em;
  font-weight: 700;
  line-height: 1;
  color: white;
  -webkit-text-stroke: 0.08em black;
  paint-order: stroke fill;
`
