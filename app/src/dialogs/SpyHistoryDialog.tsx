import { css } from '@emotion/react'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { Dialog, fontSizeCss, MaterialComponent, PlayMoveButton, ThemeButton, useMaterialDescription, usePlayerName } from '@gamepark/react-game'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { SeenSpy } from '../history/spiedLooks'
import { copper } from '../theme'

type SpyHistoryDialogProps = {
  open: boolean
  close: () => void
  spies: SeenSpy[]
}

/**
 * What happened to a pile this round: who looked into it, and which end of it they slid the item back into
 * (see {@link Memory.Spies}).
 *
 * All of that was open at the table when it happened, so those lines are a reminder rather than a reveal. What was
 * seen is not: it is drawn on the lines of the player who saw it and on nobody else's, which is the table itself
 * being asked again what it once showed, and one player leaning over to look at the other's line is a thing a
 * screen makes as impossible as a table does (see {@link useRoundSpies}).
 */
export const SpyHistoryDialog = ({ open, close, spies }: SpyHistoryDialogProps) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <h2 css={title}>{t('spy.history.title')}</h2>
        <ul css={list}>
          {spies.map((spy, index) => (
            <SpyLine key={index} spy={spy} close={close} />
          ))}
        </ul>
        <div css={buttons}>
          <ThemeButton onClick={close}>{t('Close', { ns: 'common' })}</ThemeButton>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * One Spy of the round, in the order they were made: the first line is the first look.
 *
 * The item comes with the Spy or does not come at all, so the line has nothing to decide either: it draws what it
 * was handed, which is the face of a card for the player who read it and nothing for the one who watched them
 * read it.
 */
const SpyLine = ({ spy, close }: { spy: SeenSpy; close: () => void }) => {
  const { t } = useTranslation()
  const player = usePlayerName(spy.player)
  return (
    <li css={line}>
      {t(spy.onTop ? 'spy.history.on-top' : 'spy.history.under', { player })}
      {spy.seen !== undefined && (
        <>
          <span css={seen}>{t('spy.history.seen')}</span>
          <SeenItem spy={spy} close={close} />
        </>
      )}
    </li>
  )
}

/**
 * The item that was seen, drawn as the table draws it, shadow and rounded corners included, and clicked to open
 * its help exactly as the piece itself is on the table.
 *
 * Its description is read through the context of the game rather than through the table the descriptions of LEDA
 * are gathered in (see {@link Material}): this dialog is opened from a button a material description draws, so
 * that table is being built at the very moment this module is loaded, and asking it for anything then would leave
 * the 2 of them waiting on each other. The context holds the same descriptions, once they are all built.
 *
 * The help takes the place of this dialog rather than opening over it: a reader clicking a piece is done with the
 * list, and 2 panes stacked on one another would be one too many.
 */
const SeenItem = ({ spy, close }: { spy: SeenSpy; close: () => void }) => {
  const description = useMaterialDescription<number, MaterialType, LocationType>(spy.pile)
  if (description === undefined) return null
  const { width, height } = description.getSize(spy.seen)
  return (
    <span css={seenItem}>
      <PlayMoveButton move={MaterialMoveBuilder.displayMaterialHelp(spy.pile, { id: spy.seen })} transient onPlay={close} css={seenButton}>
        <MaterialComponent type={spy.pile} itemId={spy.seen} css={fontSizeCss(Math.min(seenSize / width, seenSize / height))} />
      </PlayMoveButton>
    </span>
  )
}

/**
 * How big the item is drawn, in the em of the table and on its longest side, whatever the shape of the piece: a
 * square card, a wide token and an upright tile are then read at one scale (see {@link DefaultHelpDisplay}).
 */
const seenSize = 18

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

/** What was seen, announced under the line that says a look was made, and slanted like a reminder. */
const seen = css`
  display: block;
  margin-top: 0.2em;
  font-size: 0.8em;
  font-style: italic;
  opacity: 0.8;
`

/**
 * Back to the em of the table, which the list has doubled: {@link seenSize} is a size of the table, and the piece
 * is drawn at the size it is drawn there.
 */
const seenItem = css`
  display: block;
  font-size: 0.5em;
  margin: 0.6em 0 1.2em;
`

/** The button is only there to make the piece clickable: nothing of it is drawn around it (see {@link MaterialLink}). */
const seenButton = css`
  && {
    display: block;
    padding: 0;
    border: none;
    background: none;
    box-shadow: none;
  }
`

const buttons = css`
  display: flex;
  justify-content: center;
  font-size: 2em;
`
