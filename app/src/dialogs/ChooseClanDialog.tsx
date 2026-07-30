import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { Dialog, ThemeButton, useLegalMoves, usePlay } from '@gamepark/react-game'
import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { clanBacks } from '../material/ClanCardDescription'
import { copper } from '../theme'

/**
 * Setup step 6: the player picks a clan among those still in the box.
 * A clan is shown by the back of its cards, which is its emblem, and which is also the back of the Victory
 * condition card the player is about to take.
 */
export const ChooseClanDialog = () => {
  const { t } = useTranslation()
  const play = usePlay()
  const moves = useLegalMoves<CustomMove<CustomMoveType, Clan>>(isCustomMoveType(CustomMoveType.ChooseClan))

  /**
   * Picking at random is a client side shortcut, not a rule: it plays one of the moves the player could have
   * clicked, so the game state cannot tell it apart from a deliberate choice.
   */
  const chooseAtRandom = () => play(moves[Math.floor(Math.random() * moves.length)])

  return (
    <Dialog open={moves.length > 0}>
      <div css={content}>
        <h2 css={title}>{t('clan.choose')}</h2>
        <div css={clanList}>
          {moves.map((move) => (
            <button key={move.data} css={clanButton} onClick={() => play(move)}>
              <img src={clanBacks[move.data!]} alt="" css={clanImage} />
              <span>{t(`clan.${move.data}`)}</span>
            </button>
          ))}
        </div>
        <ThemeButton css={randomButton} onClick={chooseAtRandom}>
          {t('clan.random')}
        </ThemeButton>
      </div>
    </Dialog>
  )
}

/** Colors come from the theme: the Dialog of the framework already applies its background and its text color. */
const content = css`
  padding: 2em 3em;
`

const title = css`
  margin: 0 0 1em;
  text-align: center;
  font-size: 2.5em;
`

const clanList = css`
  display: flex;
  gap: 2em;
`

const clanButton = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
  font-size: 1.8em;
  transition: transform 0.1s ease-in-out;

  &:hover,
  &:focus {
    transform: scale(1.05);
  }
`

const clanImage = css`
  width: 8em;
  border-radius: 0.4em;
  border: 0.1em solid ${copper};
  box-shadow: 0 0.15em 0.4em rgba(0, 0, 0, 0.45);
`

const randomButton = css`
  display: block;
  margin: 1.5em auto 0;
  font-size: 1.6em;
`
