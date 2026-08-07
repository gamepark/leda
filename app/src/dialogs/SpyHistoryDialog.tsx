import { css } from '@emotion/react'
import { Spy } from '@gamepark/leda/rules/spy'
import { Dialog, ThemeButton, usePlayerName } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { copper } from '../theme'

type SpyHistoryDialogProps = {
  open: boolean
  close: () => void
  spies: Spy[]
}

/**
 * What happened to a pile this round: who looked into it, and which end of it they slid the item back into
 * (see {@link Memory.Spies}).
 *
 * Everything here was open at the table when it happened, so this dialog is a reminder rather than a reveal: what
 * the player who looked saw is theirs alone, and is nowhere in it.
 */
export const SpyHistoryDialog = ({ open, close, spies }: SpyHistoryDialogProps) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <h2 css={title}>{t('spy.history.title')}</h2>
        <ul css={list}>
          {spies.map((spy, index) => (
            <SpyLine key={index} spy={spy} />
          ))}
        </ul>
        <div css={buttons}>
          <ThemeButton onClick={close}>{t('spy.history.close')}</ThemeButton>
        </div>
      </div>
    </Dialog>
  )
}

/** One Spy of the round, in the order they were made: the first line is the first look. */
const SpyLine = ({ spy }: { spy: Spy }) => {
  const { t } = useTranslation()
  const player = usePlayerName(spy.player)
  return <li css={line}>{t(spy.onTop ? 'spy.history.on-top' : 'spy.history.under', { player })}</li>
}

/** Colors come from the theme: the Dialog of the framework already applies its background and its text color. */
const content = css`
  padding: 2em 3em;
`

const title = css`
  margin: 0 0 0.6em;
  text-align: center;
  font-size: 2.4em;
`

/** A plain list: the bullets are the copper of the frames the rulebook prints its headings in. */
const list = css`
  margin: 0 0 1.5em;
  padding-left: 1.2em;
  max-width: 24em;
  font-size: 2em;

  li::marker {
    color: ${copper};
  }
`

const line = css`
  margin-bottom: 0.4em;
  line-height: 1.3;
`

const buttons = css`
  display: flex;
  justify-content: center;
  font-size: 2em;
`
