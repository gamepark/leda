import { css } from '@emotion/react'
import { Dialog, ThemeButton } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { AwakeningIcon } from '../headers/AwakeningIcon'

type AwakeningRuleDialogProps = {
  open: boolean
  close: () => void
}

/**
 * What an Awakening waits for, told to a player who wonders why the one they just gained did nothing yet
 * (see {@link AwakeningButtons}).
 */
export const AwakeningRuleDialog = ({ open, close }: AwakeningRuleDialogProps) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <p css={text}>
          <AwakeningIcon /> {t('awakening.explain')}
        </p>
        <div css={buttons}>
          <ThemeButton onClick={close}>{t('Close', { ns: 'common' })}</ThemeButton>
        </div>
      </div>
    </Dialog>
  )
}

const content = css`
  padding: 2em 3em;
`

const text = css`
  margin: 0 0 1.5em;
  font-size: 2em;
  max-width: 24em;
`

const buttons = css`
  display: flex;
  justify-content: center;
  font-size: 2em;
`
