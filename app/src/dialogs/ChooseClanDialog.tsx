import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { Dialog, PlayMoveButton, ThemeButton, useLegalMoves, usePlay } from '@gamepark/react-game'
import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { clanBacks } from '../material/ClanCardDescription'
import { copper } from '../theme'

type ChooseClanDialogProps = {
  open: boolean
  close: () => void
}

/**
 * Setup step 6: the player picks a clan among those still in the box.
 * A clan is shown by the back of its cards, which is its emblem, and which is also the back of the Victory
 * condition card the player is about to take.
 * Opening and closing is owned by ChooseClanHeader, which is what reopens the dialog once it has been dismissed.
 */
export const ChooseClanDialog = ({ open, close }: ChooseClanDialogProps) => {
  const { t } = useTranslation()
  const play = usePlay()
  const moves = useLegalMoves<CustomMove<CustomMoveType, Clan>>(isCustomMoveType(CustomMoveType.ChooseClan))

  /**
   * Picking at random is a client side shortcut, not a rule: it plays one of the moves the player could have
   * clicked, so the game state cannot tell it apart from a deliberate choice.
   * This one cannot be a PlayMoveButton: which move it plays is only decided on the click, and drawing it during
   * the render would make the render impure.
   */
  const chooseAtRandom = () => {
    play(moves[Math.floor(Math.random() * moves.length)])
    close()
  }

  // onPlay closes on the spot: taking a clan creates a deck, shuffles it and draws from it, and the active player
  // only changes once all of that has finished animating, which is far too late to close the dialog.
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <h2 css={title}>{t('clan.choose')}</h2>
        <div css={clanList}>
          {moves.map((move) => (
            <PlayMoveButton key={move.data} move={move} onPlay={close} css={clanButton}>
              <img src={clanBacks[move.data!]} alt="" css={clanImage} />
              <span>{t(`clan.${move.data}`)}</span>
            </PlayMoveButton>
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
  padding: 0 0 0.5em;
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
  font-size: 1.8em;
  transition: transform 0.1s ease-in-out;
  border-radius: 1em;

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

/** Sized between the clan labels and the title, so it reads as a choice of its own rather than as a footnote. */
const randomButton = css`
  display: block;
  margin: 1.2em auto 0;
  font-size: 2.2em;
  padding: 0.4em 1.2em;
`
