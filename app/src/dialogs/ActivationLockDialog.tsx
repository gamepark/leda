import { css } from '@emotion/react'
import { Dialog, ThemeButton } from '@gamepark/react-game'
import { Trans, useTranslation } from 'react-i18next'
import { activationRuleCode } from '../material/helpLayout'

type ActivationLockDialogProps = {
  open: boolean
  close: () => void
}

/**
 * Why a square carrying a lock is not being offered: what it holds has already been activated this phase, and
 * nothing is activated twice during one activation (see {@link Memory.ActivatedItems}).
 *
 * A rule of the FAQ of the game and not of its rulebook, which is exactly why it is spelled out on the table: a
 * player who knows the box by heart is the one most likely to look for the square they expected to be offered.
 *
 * The rule itself is the very sentence the cards it bears on print under their help, and is read from there
 * rather than written a second time here (see {@link ClanCardHelp}): a player meeting it in both places is owed
 * the same words, and a translator rewording it has one line to reword. What is added here is the only thing the
 * table knows that a card does not: which square is being talked about, and until when.
 */
export const ActivationLockDialog = ({ open, close }: ActivationLockDialogProps) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <p css={text}>
          <Trans defaults={t(activationRuleCode)} /> {t('activation.lock')}
        </p>
        <div css={buttons}>
          {/* "Close" is the platform's own word for it, in the namespace the game shares with every other one. */}
          <ThemeButton onClick={close}>{t('Close', { ns: 'common' })}</ThemeButton>
        </div>
      </div>
    </Dialog>
  )
}

/** Colors come from the theme: the Dialog of the framework already applies its background and its text color. */
const content = css`
  padding: 2em 3em;
`

/** Sized in the ems of the text itself rather than the dialog's, like every other dialog of the game. */
const text = css`
  margin: 0 0 1.5em;
  font-size: 2em;
  max-width: 26em;
  line-height: 1.3;
`

const buttons = css`
  display: flex;
  justify-content: center;
  font-size: 2em;
`
