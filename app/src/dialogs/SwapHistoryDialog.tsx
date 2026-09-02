import { css } from '@emotion/react'
import { OrganisationSwap } from '@gamepark/leda/rules/swap'
import { Dialog, ThemeButton, usePlayerName } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'

type SwapHistoryDialogProps = {
  open: boolean
  close: () => void
  swap: OrganisationSwap
}

/**
 * What happened to the 2 squares carrying the mark: their owner swapped them while organising their grid this
 * round (see {@link Memory.OrganisationSwaps}).
 *
 * Everything here was open at the table when it happened, so this dialog is a reminder rather than a reveal,
 * exactly like the one a spied pile opens (see {@link SpyHistoryDialog}).
 */
export const SwapHistoryDialog = ({ open, close, swap }: SwapHistoryDialogProps) => {
  const { t } = useTranslation()
  const player = usePlayerName(swap.player)
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <p css={text}>{t('swap.history.text', { player })}</p>
        <div css={buttons}>
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

const text = css`
  margin: 0 0 1.2em;
  max-width: 24em;
  font-size: 2em;
  line-height: 1.3;
  text-align: center;
`

const buttons = css`
  display: flex;
  justify-content: center;
  font-size: 2em;
`
