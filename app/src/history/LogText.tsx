import { css } from '@emotion/react'
import { Picture } from '@gamepark/react-game'
import { ReactElement } from 'react'
import { Trans } from 'react-i18next'
import MilitaryImage from '../images/icons/Military.png'
import MilitaryVictoryImage from '../images/icons/MilitaryVictory.png'
import SharkImage from '../images/icons/Shark.png'
import FoodImage from '../images/tokens/food.png'

/**
 * One sentence of the journal, written with the symbols the game prints rather than with the words they stand for,
 * exactly as the help dialogs are (see {@link HelpText}).
 *
 * The pieces a sentence names are not part of the fixed set below: they are handed in as `components`, since each
 * of them is the picture of one item and opens the help of that very item (see {@link MaterialLink}).
 */
export const LogText = ({ code, values, components }: { code: string; values?: Record<string, unknown>; components?: Record<string, ReactElement> }) => (
  <Trans i18nKey={code} values={values} components={{ ...icons, ...components }} />
)

/** A symbol drawn inline in a sentence, where a text would name what the game prints as an icon. */
const Icon = ({ src }: { src: string }) => <Picture src={src} css={inlineIcon} alt="" />

/** The symbols the log sentences are written with: what a player gains, and what they gather it towards. */
const icons = {
  food: <Icon src={FoodImage} />,
  military: <Icon src={MilitaryImage} />,
  victory: <Icon src={MilitaryVictoryImage} />,
  shark: <Icon src={SharkImage} />
}

/** Sized off the text of the entry and dropped onto the middle of its lowercase letters, like a word of it. */
const inlineIcon = css`
  && {
    height: 1.2em;
    top: 0;
    vertical-align: -0.25em;
  }
`
