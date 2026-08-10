import { css } from '@emotion/react'
import { VictoryProgress } from '@gamepark/leda/rules/victory'
import { Picture } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { race } from '../victoryProgress'

/** The 2 races of the game, which is all the result popup has to line up: LEDA is won and not scored. */
export type VictoryRace = 'clan' | 'military'

/** The name of a race, in words: the symbol it is run with is not the same for the 2 players. */
export const RaceName = ({ race: type }: { race: VictoryRace }) => {
  const { t } = useTranslation()
  return <>{t(`game-over.race.${type}`)}</>
}

/**
 * Where one player stands on one race: their own symbol and their own 2 numbers, the goal of a race belonging to
 * the clan, so the 2 cells of a line rarely hold the same one.
 */
export const RaceProgress = ({ image, progress }: { image: string; progress: VictoryProgress }) => (
  <span css={progressLine}>
    <Picture src={image} css={icon} alt="" />
    {race(progress)}
  </span>
)

const progressLine = css`
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
`

/** Sized off the text it stands next to, like every other symbol drawn inside a sentence of this game. */
const icon = css`
  && {
    height: 1.4em;
    top: 0;
  }
`
