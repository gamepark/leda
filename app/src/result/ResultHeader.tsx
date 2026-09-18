import { css } from '@emotion/react'
import { useTranslation } from 'react-i18next'
import { useRoundNumber } from '../useRoundNumber'
import { GameOverHeader } from './GameOverHeader'

/**
 * The title of the result popup: the sentence naming the winner (see {@link GameOverHeader}), and under it the round
 * the game ended on, which is the same for both players and so has no place in the table of their columns.
 */
export const ResultHeader = () => {
  const { t } = useTranslation()
  const round = useRoundNumber()
  return (
    <>
      <GameOverHeader />
      {round > 0 && <span css={roundLine}>{t('game-over.round', { round })}</span>}
    </>
  )
}

/** Its own line, and read as a note under the title rather than as a second title. */
const roundLine = css`
  display: block;
  margin-top: 0.3em;
  font-size: 0.75em;
  font-weight: normal;
`
