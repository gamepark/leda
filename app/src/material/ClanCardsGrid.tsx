import { css } from '@emotion/react'
import { Clan, clanCards } from '@gamepark/leda/Clan'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialComponent, pointerCursorCss, usePlay } from '@gamepark/react-game'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { tileSize } from './TileDescription'

/**
 * The 11 to 13 cards of a clan, in punchboard order, laid out as the table of contents of that clan: what it may
 * ever play, whatever is left in the deck and whatever has already been drawn. Read from the deck of a player,
 * where it is what may still come out of the pile (see {@link PlayerDeckHelp}), and from their Victory condition
 * card, where it is the clan they took (see {@link VictoryConditionCardHelp}).
 *
 * A card is opened by its id alone and not as an item of a location, which it may well not be one of any more: an
 * id is the whole of what its help reads, while an item would have the dialog offer to page through the cards
 * around it, which are face down and have nothing to show.
 */
export const ClanCardsGrid = ({ clan }: { clan: Clan }) => {
  const play = usePlay()
  const cards = clanCards(clan)
  return (
    <ol css={grid(cards.length)}>
      {cards.map((card) => {
        const id = { front: card, back: clan }
        return (
          <li key={card}>
            <MaterialComponent
              type={MaterialType.ClanCard}
              itemId={id}
              css={pointerCursorCss}
              onClick={() =>
                play(MaterialMoveBuilder.displayMaterialHelp<number, MaterialType, LocationType>(MaterialType.ClanCard, { id }), {
                  local: true
                })
              }
            />
          </li>
        )
      })}
    </ol>
  )
}

/** The gap between 2 cards of the grid, in the em of the grid itself, which its width is counted in as well. */
const gridGap = 0.6

/**
 * As wide as it takes for the clan to be read in 3 rows, which is 4 cards a row for the 11 of most clans and 5 for
 * the 13 of the Cats: 3 rows is what the dialog holds without scrolling, and the rows come out even rather than
 * leaving one card alone underneath. The cards are square and as wide as a tile, so a row is that many of those
 * plus the gaps between them, and the list wraps on its own rather than shrinking them if the dialog ever opens
 * narrower than that.
 * The padding at the top and the bottom is the room the lift on hover takes: the dialog scrolls its content, and
 * without it the raised card would be clipped.
 */
const grid = (cards: number) => {
  const columns = Math.ceil(cards / 3)
  return css`
    display: flex;
    flex-wrap: wrap;
    list-style-type: none;
    gap: ${gridGap}em;
    padding: 0.3em 0 0.5em;
    margin: 0.5em 0 0;
    font-size: 1.2em;
    max-width: calc(${columns} * ${tileSize}em + ${columns - 1} * ${gridGap}em);

    li {
      display: flex;
      transition: transform 0.18s cubic-bezier(0.3, 1.4, 0.4, 1);
    }

    li:hover {
      transform: translateY(-0.25em);
      z-index: 1;
    }
  `
}
