import { css } from '@emotion/react'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { militaryVictoryTokenQuantities, militaryVictoryTokens, MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { MaterialComponent, pointerCursorCss, usePlay, useRules } from '@gamepark/react-game'
import { getEnumValues, MaterialMoveBuilder } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { HelpTitle, Note, Paragraph } from './helpLayout'
import { militaryVictoryToken } from './MilitaryVictoryTokenDescription'
import { ClanGoals } from './MilitaryVictoryTokenHelp'

/**
 * The pile of Military Victory tokens, which is what a click on one of its tokens opens rather than the help of
 * that token (see MilitaryVictoryTokenDescription.displayHelp): the pile is face down and shuffled, so the token
 * on top says no more than "some token" does. What is worth reading is the pile itself: how deep it still is, and
 * what may come out of it, which is fixed and printed.
 *
 * The 8 tokens underneath are the whole punchboard and not what is left in the pile: which of them are still in
 * there is nobody's to know, exactly as the cards of a clan are read from the deck of their owner
 * (see {@link ClanCardsGrid}). Each is shown with its number of copies, without which a list of 8 would say
 * nothing about a pile of 18.
 */
export const MilitaryVictoryDeckHelp = () => {
  const { t } = useTranslation()
  const rules = useRules<LedaRules>()
  if (rules === undefined) return null
  const count = rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck).length
  return (
    <>
      <HelpTitle>{t('help.token.pile-title')}</HelpTitle>
      <Paragraph>{t('help.token.pile-count', { count })}</Paragraph>
      <Paragraph>{t('help.token.all', { count: militaryVictoryTokens.length })}</Paragraph>
      <MilitaryVictoryTokensRow />
      <Note code="help.note.conflict" />
      <ClanGoals />
    </>
  )
}

/**
 * The 8 tokens, in the order of the rulebook glossary, which is the order they are numbered in and not an order
 * they ever come out in: the pile is shuffled, and nothing says which of them is next.
 * Each opens what it is worth, its own help, as a token won by a player would (see {@link MilitaryVictoryTokenHelp}),
 * and is opened by its id alone rather than as an item of the pile, whose items have no face to show.
 */
const MilitaryVictoryTokensRow = () => {
  const play = usePlay()
  return (
    <ol css={row}>
      {getEnumValues(MilitaryVictoryTokenId).map((token) => (
        <li key={token}>
          <MaterialComponent
            type={MaterialType.MilitaryVictoryToken}
            itemId={token}
            css={pointerCursorCss}
            onClick={() =>
              play(MaterialMoveBuilder.displayMaterialHelp<number, MaterialType, LocationType>(MaterialType.MilitaryVictoryToken, { id: token }), {
                local: true
              })
            }
          />
          <span css={copies}>×{militaryVictoryTokenQuantities[token]}</span>
        </li>
      ))}
    </ol>
  )
}

/** The gap between 2 tokens of the row, in the em of the list itself, which its width is counted in as well. */
const rowGap = 0.6

/**
 * The 8 tokens in 2 rows of 4, which is as wide as the paragraphs above them and leaves no token alone on a line.
 * The list wraps on its own rather than shrinking the tokens if the dialog ever opens narrower than that.
 * The padding at the top and the bottom is the room the lift on hover takes, as in the grid of a clan
 * (see {@link ClanCardsGrid}): the dialog scrolls its content, and without it the raised token would be clipped.
 */
const row = css`
  display: flex;
  flex-wrap: wrap;
  list-style-type: none;
  gap: ${rowGap}em;
  padding: 0.3em 0 0.5em;
  margin: 0.5em 0 0;
  max-width: calc(4 * ${militaryVictoryToken.width}em + 3 * ${rowGap}em);

  li {
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.18s cubic-bezier(0.3, 1.4, 0.4, 1);
  }

  li:hover {
    transform: translateY(-0.25em);
    z-index: 1;
  }
`

/**
 * How many copies of that token the game holds, under it rather than over it: a token is a disc with one symbol
 * on it, and a number laid over it would be read as something the token prints.
 */
const copies = css`
  margin-top: 0.15em;
  font-size: 0.9em;
  font-weight: 700;
  line-height: 1;
`
