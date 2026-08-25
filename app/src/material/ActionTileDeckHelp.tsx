import { css } from '@emotion/react'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { roundsPerCycle } from '@gamepark/leda/rules/EndOfRoundRule'
import { MaterialComponent, Picture, pointerCursorCss, usePlay, useRules } from '@gamepark/react-game'
import { getEnumValues, MaterialMoveBuilder } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import ActivationsPerSquare from '../images/help/activations-per-square.jpg'
import { actionTile } from './ActionTileDescription'
import { HelpTitle, Note, Paragraph } from './helpLayout'

/**
 * The pile of Action tiles, which is what a click on one of its tiles opens rather than the help of that tile
 * (see ActionTileDescription.displayHelp): the pile is face down and shuffled, so the tile on top says no more
 * than "some tile" does. What is worth reading is the pile itself, and it is the one face down pile of the game
 * a player may read entirely: 5 tiles that are always the same 5, minus the ones already revealed in front of
 * them, which are lying face up on the table (see {@link tilesLeftInPile}).
 *
 * Beside it, the one thing about these tiles that is not printed on any of them: how often a given square of a
 * grid may be activated, which is what a player organising their grid is really asking (see {@link frequencyCard}).
 */
export const ActionTileDeckHelp = () => {
  const { t } = useTranslation()
  const rules = useRules<LedaRules>()
  if (rules === undefined) return null
  const left = tilesLeftInPile(rules)
  return (
    <>
      <HelpTitle>{t('help.action.pile-title')}</HelpTitle>
      <Paragraph>{t('help.action.pile-count', { count: left.length })}</Paragraph>
      <ActionTilesRow tiles={left} />
      <div css={columns}>
        <div css={notesColumn}>
          <Note code="help.note.action" />
          <Note code="help.note.cycle" values={{ count: roundsPerCycle }} />
          {/*
           * The one square a tile is sure to activate, which the rulebook points out beside the card below: the
           * 3 zones of tile 1 all cover the top left square, the 3 zones of tile 4 all cover the bottom right one,
           * so whichever zone the active player picks, those 2 squares come up (see {@link actionTileZones}).
           * The tiles are named by their number, which is the value of their id and what the rulebook calls them by.
           */}
          <Note code="help.note.certain-squares" values={{ first: ActionTileId.TopLeft, last: ActionTileId.BottomRight }} />
        </div>
        <div css={frequencyColumn}>
          {/*
           * A reminder like the ones beside it, and written as one: nothing on a tile says how often a square comes
           * up, and the line would read as something the material prints if it were told in the plain text.
           */}
          <Note code="help.action.frequency" values={{ count: roundsPerCycle }} />
          {/*
           * The player aid card of the box, as it is printed: how many times at most a square may be activated in
           * one cycle, which is how many of the 5 tiles have a zone covering it (see {@link actionTileZones}).
           */}
          <Picture src={ActivationsPerSquare} alt="" css={frequencyCard} />
        </div>
      </div>
    </>
  )
}

/**
 * The tiles still in the pile, by elimination: the 5 tiles of the game are always the same 5, so whatever is not
 * lying face up between the players is still face down in the pile.
 *
 * A tile a Spy effect is holding is counted here as well, and rightly so: it left the pile to be looked at and is
 * going straight back into it, and whether it is on top or underneath is no more open than the rest of the pile.
 */
const tilesLeftInPile = (rules: LedaRules): ActionTileId[] => {
  const revealed = rules.material(MaterialType.ActionTile).location(LocationType.ActionTileRevealed).getItems<ActionTileId>()
  return getEnumValues(ActionTileId).filter((tile) => !revealed.some((item) => item.id === tile))
}

/**
 * The tiles left, in the order they are numbered on, which is the order the rulebook calls them by and not the
 * order they will come out in: the pile is shuffled, and nothing says which of them is next.
 * Each opens the zones it offers, its own help, as a tile of the table would (see {@link ActionTileHelp}).
 */
const ActionTilesRow = ({ tiles }: { tiles: ActionTileId[] }) => {
  const play = usePlay()
  return (
    <ol css={row}>
      {tiles.map((tile) => (
        <li key={tile}>
          <MaterialComponent
            type={MaterialType.ActionTile}
            itemId={tile}
            css={pointerCursorCss}
            onClick={() =>
              play(MaterialMoveBuilder.displayMaterialHelp<number, MaterialType, LocationType>(MaterialType.ActionTile, { id: tile }), { local: true })
            }
          />
        </li>
      ))}
    </ol>
  )
}

/**
 * The 5 tiles are 4 cm wide at most, so they are read in one row however many are left, and the row is laid out
 * as the grid of a clan is (see {@link ClanCardsGrid}): the same gap between 2 tiles, and the same lift on hover,
 * which the padding above and below leaves the room for.
 * The gap itself is that much narrower than the one of the cards, because each tile image carries the transparent
 * margin its shadow is drawn in and 2 neighbours already stand 2 of those apart (see {@link actionTile}).
 *
 * Read at the size of the text and not one fifth above it, as the cards of a clan are: a tile prints a number and
 * the shape of its zones, which is recognised rather than read, and every centimeter the row does not take is one
 * the dialog does not have to scroll.
 */
const row = css`
  display: flex;
  list-style-type: none;
  gap: ${0.6 - 2 * actionTile.margin}em;
  padding: 0.3em 0 0.5em;
  margin: 0.5em 0 0;

  li {
    display: flex;
    transition: transform 0.18s cubic-bezier(0.3, 1.4, 0.4, 1);
  }

  li:hover {
    transform: translateY(-0.25em);
    z-index: 1;
  }
`

/**
 * The reminders and the player aid card side by side, rather than one under the other: a dialog is as wide as
 * what it holds and only 9 tenths of the screen tall, so a column of text with a card of the box underneath it
 * scrolls, while the 2 of them next to one another fit.
 * They wrap back into one column when the screen is too narrow to hold both, which is what a phone held upright
 * comes to.
 */
const columns = css`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1em;
`

/** The texts keep the width a paragraph reads well at, which is the one every other help is written to. */
const notesColumn = css`
  flex: 1 1 16em;
`

/** The card is read as a whole and not line by line, so it is narrower than the texts beside it. */
const frequencyColumn = css`
  flex: 0 1 16em;
`

/**
 * The player aid card fills its column, which is what decides its size: it is a 4x4 grid of symbols read against
 * a legend, and it is worth the width of a paragraph rather than the width of a card of the table.
 * The double ampersand is what a picture of this game needs to beat the styles the dialog gives its images.
 */
const frequencyCard = css`
  && {
    display: block;
    width: 100%;
    border-radius: 0.5em;
  }
`
