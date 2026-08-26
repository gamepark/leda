import { css } from '@emotion/react'
import { RoundPhase } from '@gamepark/leda/rules/roundPhase'
import { Dialog, Picture } from '@gamepark/react-game'
import { getEnumValues } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { HelpText, HelpTitle, Line, Note } from '../material/helpLayout'
import { roundPhaseImages } from '../roundPhaseImages'
import { copper, parchmentDark } from '../theme'

type RoundPhaseDialogProps = {
  open: boolean
  close: () => void
}

/**
 * What a round is made of, opened from the line of the aid card the round is on: the card whole on one side, and
 * on the other the 3 phases in a few words each, in the order the card numbers them.
 *
 * Written as a reminder and not as the rulebook: what a phase asks in detail is read on the material it is asked
 * on, which every piece of the table opens its own help for.
 */
export const RoundPhaseDialog = ({ open, close }: RoundPhaseDialogProps) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <HelpTitle>{t('help.round.title')}</HelpTitle>
        <div css={columns}>
          {/* The 3 lines with nothing between them: stacked edge to edge, they are the card as it is printed. */}
          <div css={card}>
            {getEnumValues(RoundPhase).map((phase) => (
              <Picture key={phase} src={roundPhaseImages[phase]} alt="" css={line} />
            ))}
          </div>
          <div css={textColumn}>
            <Line label={t('help.round.activation')}>
              <HelpText code="help.round.activation-text" />
            </Line>
            <Line label={t('help.round.conflict')}>
              <HelpText code="help.round.conflict-text" />
            </Line>
            <Line label={t('help.round.organisation')}>
              <HelpText code="help.round.organisation-text" />
            </Line>
            <Note code="help.round.next" />
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * Colors come from the theme: the Dialog of the framework already applies its background and its text color.
 * The font size is the one the texts of this game are read at, and the padding is written in it, so it comes to
 * the same margin as every other dialog of the game (see {@link SpyHistoryDialog}).
 */
const content = css`
  padding: 1em 1.5em;
  font-size: 2em;
`

/**
 * The card and the texts side by side, and one under the other when the screen is too narrow to hold both, which
 * is what a phone held upright comes to: the same layout the pile of Action tiles opens its help in
 * (see {@link ActionTileDeckHelp}).
 */
const columns = css`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.2em;
`

/** The card is read as a whole and not line by line, so it is no wider than a paragraph of the text beside it. */
const card = css`
  flex: 0 0 auto;
  width: 14em;
  border: 0.1em solid ${copper};
  border-radius: 0.4em;
  overflow: hidden;
  box-shadow: 0 0.2em 0.6em rgba(0, 0, 0, 0.35);
`

/**
 * One line of the card, filling its width. The double ampersand is what a picture of this game needs to beat the
 * styles the dialog gives its images, and `display: block` is what keeps the 3 of them from being spaced out as
 * words of a sentence would be.
 */
const line = css`
  && {
    display: block;
    width: 100%;
  }
`

/** The texts keep the width a paragraph reads well at, which is the one every other help is written to. */
const textColumn = css`
  flex: 1 1 16em;
  border-left: 0.1em solid ${parchmentDark};
  padding-left: 1.2em;
`
