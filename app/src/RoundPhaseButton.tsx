import { css } from '@emotion/react'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { roundPhase } from '@gamepark/leda/rules/roundPhase'
import { buttonResetCss, Picture, useRules } from '@gamepark/react-game'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RoundPhaseDialog } from './dialogs/RoundPhaseDialog'
import { roundPhaseCard, tableXMax, tableYMin } from './locators/Locators'
import { roundPhaseImages } from './roundPhaseImages'
import { copper } from './theme'

/**
 * Which of the 3 phases the round is in, told the way the player aid card of the box tells it: the line that card
 * prints for that phase, and nothing else (see {@link roundPhase}).
 *
 * It opens the middle column of the table, level with the first row of the grids, and everything the column holds
 * is laid under it (see {@link roundPhaseCard}). The line is a button, and it opens the card whole beside a
 * reminder of the 3 phases: what is drawn here is a pictogram, so whoever does not read it has the whole of it
 * one click away (see {@link RoundPhaseDialog}).
 * Nothing is drawn while the players are still picking their clans: no round has started yet, and the column it
 * opens is empty as well.
 */
export const RoundPhaseButton = () => {
  const { t } = useTranslation()
  const rules = useRules<LedaRules>()
  const [open, setOpen] = useState(false)
  const phase = rules === undefined ? undefined : roundPhase(rules)
  if (phase === undefined) return null
  return (
    <>
      <div css={anchor}>
        <button css={button} aria-label={t('help.round.title')} onClick={() => setOpen(true)}>
          <Picture src={roundPhaseImages[phase]} alt="" css={line} />
        </button>
      </div>
      <RoundPhaseDialog open={open} close={() => setOpen(false)} />
    </>
  )
}

/**
 * The corner the coordinates of the table are counted from, which is where the framework anchors every piece of
 * material as well: a location of the game is placed inside a box lying at (-xMin, -yMin) of the table, and this
 * is that same box, opened by hand for the one thing on the table that is no material of the game.
 */
const anchor = css`
  position: absolute;
  left: ${tableXMax}em;
  top: ${-tableYMin}em;
  transform-style: preserve-3d;
`

/**
 * As wide as the middle column, and level with the first row of the grids by its top edge rather than by its
 * middle: the 3 lines of the card are not the same height, and a line held by its middle would leave the top of
 * the column moving from one phase to the next.
 * Everything is written in the centimeters of the table, like the size of every piece laid on it.
 */
const button = [
  buttonResetCss,
  css`
    position: absolute;
    width: ${roundPhaseCard.width}em;
    height: ${roundPhaseCard.height}em;
    transform: translate(-50%, ${roundPhaseCard.top}em);
    padding: 0;
    border: 0.08em solid ${copper};
    border-radius: 0.2em;
    overflow: hidden;
    box-shadow: 0 0.1em 0.25em rgba(0, 0, 0, 0.5);
    cursor: pointer;
    transition: transform 0.1s ease-in-out;

    &:hover,
    &:focus {
      transform: translate(-50%, ${roundPhaseCard.top}em) scale(1.03);
    }
  `
]

/**
 * The line fills the width of the button and keeps its own height, which is why the button reserves the height of
 * the tallest of the 3: a shorter line leaves the table showing under it rather than being stretched to fill.
 * The double ampersand is what a picture of this game needs to beat the styles it is given elsewhere.
 */
const line = css`
  && {
    display: block;
    width: 100%;
  }
`
