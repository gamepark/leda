import { css } from '@emotion/react'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { isPileTop, spiesOnPile } from '@gamepark/leda/rules/spy'
import { useRules } from '@gamepark/react-game'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SpyHistoryDialog } from '../dialogs/SpyHistoryDialog'
import { LedaMenuButton } from './LedaMenuButton'
import { spyButtonX } from './spiedItem'

/**
 * The mark a pile carries once a Spy has been made on it this round: an eye with a question mark, opening the list
 * of what happened to that pile (see {@link SpyHistoryDialog}).
 *
 * There is nothing to see on a pile that was looked into, which is the whole point: a player who was watching
 * their own side of the table has no way of knowing that the top of a pile has been read and maybe sent to the
 * bottom of it. So the pile says so itself, for the round it happened in and no longer.
 *
 * On the opposite side of the pile from the button that makes a Spy, so that the 2 never sit on one another: a
 * Spy may well land on a pile that has already been looked into (see {@link SpyPileButton}).
 * Read through the hooks rather than through the context handed to the material description: what it shows lives
 * in the memory of the game, so the pile it hangs on never changes when it does. And through {@link useRules}
 * rather than the guarded reading the buttons that play a move need: this one plays none, and a spectator, who has
 * no seat and therefore no move to play, is entitled to it like anybody else.
 */
export const SpyHistoryButton = ({ type, index, player }: { type: MaterialType; index: number; player?: number }) => {
  const rules = useRules<LedaRules>()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  if (rules === undefined) return null
  const spies = spiesOnPile(rules, type, player)
  if (spies.length === 0 || !isPileTop(rules, type, index, player)) return null

  return (
    <>
      <LedaMenuButton x={-spyButtonX(type)} labelPosition="left" onClick={() => setOpen(true)}>
        {/* Wrapped so that the mark is not a span the medallion can reach: it paints its direct spans as the label of the framework. */}
        <div css={mark}>
          <FontAwesomeIcon icon={faEye} />
          <span>?</span>
        </div>
      </LedaMenuButton>
      <SpyHistoryDialog open={open} close={() => setOpen(false)} spies={spies} />
    </>
  )
}

/** The eye and its question mark side by side, small enough for the two of them to fit the medallion. */
const mark = css`
  display: flex;
  align-items: center;
  gap: 0.1em;
  font-size: 0.75em;
  font-weight: 700;
`
