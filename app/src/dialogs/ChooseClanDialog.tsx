import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { Dialog, PlayMoveButton, ThemeButton, useLegalMoves, usePlay } from '@gamepark/react-game'
import { CustomMove, isCustomMoveType, MaterialMoveBuilder } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { clanBacks } from '../material/ClanCardDescription'
import { medallionFace } from '../material/medallion'
import { copper } from '../theme'

type ChooseClanDialogProps = {
  open: boolean
  close: () => void
}

/**
 * Opens the Victory condition card of a clan, which is the whole of what taking that clan means: its 2 races,
 * what its crystal is worth, and, behind a button of its own, the cards of its deck
 * (see {@link VictoryConditionCardHelp}). The card is opened by its clan alone, as the card of a player who has
 * not taken it does not exist yet, and there is nothing to page through.
 */
const showClan = (clan: Clan) =>
  MaterialMoveBuilder.displayMaterialHelp<number, MaterialType, LocationType>(MaterialType.VictoryConditionCard, { id: clan })

/**
 * Setup step 6: the player picks a clan among those still in the box.
 * A clan is shown by the back of its cards, which is its emblem, and which is also the back of the Victory
 * condition card the player is about to take. Under it, the 2 things one may do with a clan one is offered: take
 * it, or read it first, which is the same help dialog its card opens once it is on the table.
 * Opening and closing is owned by ChooseClanHeader, which is what reopens the dialog once it has been dismissed,
 * and what steps aside while a clan is being read.
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
            <div key={move.data} css={clan}>
              {/*
               * The emblem is what opens the clan, the way a card of the table is opened by being clicked, and the
               * mark in its corner is what says so. Transient: reading a clan is not a move of the game, and leaves
               * nothing behind in the history.
               * A button of its own rather than a PlayMoveButton, whose parchment frame would be drawn around the
               * emblem, and a plain one rather than the medallion of an item, which the mark alone borrows.
               */}
              <button type="button" css={clanCard} onClick={() => play(showClan(move.data!), { transient: true })} title={t('clan.view')}>
                <img src={clanBacks[move.data!]} alt={t(`clan.${move.data}`)} css={clanImage} />
                <span css={helpMark} aria-hidden="true">
                  ?
                </span>
              </button>
              <span>{t(`clan.${move.data}`)}</span>
              <PlayMoveButton move={move} onPlay={close} css={pickButton}>
                {t('clan.pick')}
              </PlayMoveButton>
            </div>
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

/**
 * The em of a clan, which the emblem, the name and the buttons are all sized in: the column is one thing read as
 * a whole, and giving each of its 3 parts its own size against the dialog is what would let them drift apart.
 */
const clan = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em;
  font-size: 1.8em;
`

/** Nothing of its own to show: it is the frame the emblem and its mark are laid in, and it lifts as one. */
const clanCard = css`
  position: relative;
  display: block;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.1s ease-in-out;

  &:hover,
  &:focus {
    transform: scale(1.05);
  }
`

const clanImage = css`
  display: block;
  width: 8em;
  border-radius: 0.4em;
  border: 0.1em solid ${copper};
  box-shadow: 0 0.15em 0.4em rgba(0, 0, 0, 0.45);
`

/**
 * The mark that says the emblem opens onto something, in the corner where the material of the table carries its
 * own buttons, and struck as the same coin (see {@link LedaMenuButton}). Read and not pressed: what is pressed is
 * the emblem underneath, which is the whole of what a player aims at, so the mark is hidden from a screen reader
 * and the button is named instead.
 */
const helpMark = css`
  ${medallionFace};
  position: absolute;
  top: 0.3em;
  right: 0.3em;
  width: 1.8em;
  height: 1.8em;
  font-weight: 700;
`

/** As wide as the emblem over it, so the 4 columns come out the same width whatever the names of their clans. */
const pickButton = css`
  align-self: stretch;
  padding: 0.3em 0;
`

/** Sized between the clan labels and the title, so it reads as a choice of its own rather than as a footnote. */
const randomButton = css`
  display: block;
  margin: 1.2em auto 0;
  font-size: 2.2em;
  padding: 0.4em 1.2em;
`
