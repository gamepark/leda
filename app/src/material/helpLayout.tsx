import { css } from '@emotion/react'
import { Picture } from '@gamepark/react-game'
import { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import FlipImage from '../images/icons/Flip.png'
import MilitaryImage from '../images/icons/Military.png'
import PandaBronzeImage from '../images/icons/PandaBronze.png'
import PandaGoldImage from '../images/icons/PandaGold.png'
import PandaSilverImage from '../images/icons/PandaSilver.png'
import UpgradeImage from '../images/icons/Upgrade.png'
import FoodImage from '../images/tokens/food.png'
import { copper } from '../theme'

/**
 * What every help dialog of the game is built out of, so that a card and the tile it is played on are read the
 * same way: a title, a line per heading the material prints, and the reminders underneath
 * (see {@link ClanCardHelp}, {@link TileHelp}).
 */

/** The name of the material, which is the only thing a piece of this game is ever called. */
export const HelpTitle = ({ children }: { children: ReactNode }) => <h2 css={title}>{children}</h2>

/** One line of the help: the heading the material prints in colour, and what follows it. */
export const Line = ({ label, children }: { label: string; children: ReactNode }) => (
  <p css={text}>
    <span css={label_}>{label}</span> {children}
  </p>
)

/**
 * A text of the rulebook, written with the symbols the game prints rather than with the words they stand for.
 * `level` is the Panda an Awakening asks for, the one symbol a text names that is not always the same one
 * (see {@link ClanCardHelp}); everything else is drawn from the fixed set below.
 */
export const HelpText = ({ code, values, level }: { code: string; values?: Record<string, unknown>; level?: string }) => (
  <Trans i18nKey={code} values={values} components={level === undefined ? icons : { ...icons, level: <Icon src={level} /> }} />
)

/** A reminder of a rule the material leans on, which is a keyword of the rulebook and is written there. */
export const Note = ({ code, values }: { code: string; values?: Record<string, unknown> }) => (
  <p css={[text, note]}>
    <HelpText code={code} values={values} />
  </p>
)

/** Anything a help has to say that is not read out of the translation files, such as a number of the rules. */
export const Paragraph = ({ children }: { children: ReactNode }) => <p css={text}>{children}</p>

/** A symbol drawn inline in a sentence, where a text would name what the game prints as an icon. */
const Icon = ({ src }: { src: string }) => <Picture src={src} css={inlineIcon} alt="" />

/**
 * The symbols the texts are written with, the ones the material itself prints beside its numbers. The levels of
 * the Pandas are named by their symbol and never in words, exactly as the rulebook names them, and what each of
 * them is is read off the Awakening reminder underneath (see ClanCardHelp.cardNotes).
 */
const icons = {
  food: <Icon src={FoodImage} />,
  military: <Icon src={MilitaryImage} />,
  upgrade: <Icon src={UpgradeImage} />,
  flip: <Icon src={FlipImage} />,
  bronze: <Icon src={PandaBronzeImage} />,
  silver: <Icon src={PandaSilverImage} />,
  gold: <Icon src={PandaGoldImage} />
}

/** Over the texts rather than over the pane: the dialog centers what it holds, which is wider than what is read. */
const title = css`
  && {
    margin: 0 0 0.5em;
    font-size: 1.1em;
    text-align: left;
  }
`

/**
 * The dialog gives its content a font size of its own, so the texts are sized against it rather than against the
 * table. The width is the one of a paragraph that reads well, and not the one the dialog happens to open at: it is
 * as wide as the material when there is nothing to page through, and 80% of the table when there is.
 */
const text = css`
  margin: 0 0 0.6em;
  line-height: 1.3;
  max-width: 20em;
`

/**
 * "Coût", "Effet", "Recto"... the headings the rulebook prints on the material itself, in the copper of its frames.
 * Trailing underscore: `label` is the prop this is applied to, and one of the 2 names has to give.
 */
const label_ = css`
  font-weight: 700;
  color: ${copper};
`

/**
 * A reminder is told apart from what the material itself says by its slant alone: the Awakening one names the
 * levels of the Pandas by their symbol, which a smaller text would leave too small to tell apart.
 */
const note = css`
  font-style: italic;
  opacity: 0.8;
`

/** Sized off the text and dropped onto the middle of the lowercase letters, so it reads as one word of a sentence. */
const inlineIcon = css`
  && {
    height: 1.2em;
    top: 0;
    vertical-align: -0.25em;
  }
`
