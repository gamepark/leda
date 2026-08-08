import { faRightLeft } from '@fortawesome/free-solid-svg-icons'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { swapOnTile } from '@gamepark/leda/rules/swap'
import { useRules } from '@gamepark/react-game'
import { useState } from 'react'
import { SwapHistoryDialog } from '../dialogs/SwapHistoryDialog'
import { HistoryMark } from './HistoryMark'
import { LedaMenuButton } from './LedaMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The mark the 2 squares of a swap carry until the end of the round: two arrows with a question mark, opening what
 * happened to them (see {@link SwapHistoryDialog}).
 *
 * A player organises their grid while their opponent has nothing to answer, and 2 squares changing places over
 * there leaves the grid looking exactly as full as it was: so the squares say so themselves, for the round it
 * happened in and no longer (see {@link Memory.OrganisationSwaps}).
 *
 * On both grids, and for everyone watching: what happened was open at the table, and a spectator is owed it like
 * anybody else. Which is also why it is read through {@link useRules} rather than through the guarded reading the
 * buttons that play a move need: this one plays none, and a spectator has no seat and therefore no move to play.
 * In the corner opposite the one the buttons of a square sit in, so that the 2 never sit on one another
 * (see {@link tileButtonPosition}).
 */
export const SwapHistoryButton = ({ tile }: { tile: number }) => {
  const rules = useRules<LedaRules>()
  const [open, setOpen] = useState(false)

  if (rules === undefined) return null
  const swap = swapOnTile(rules, tile)
  if (swap === undefined) return null

  return (
    <>
      <LedaMenuButton x={-tileButtonPosition.x} y={tileButtonPosition.y} labelPosition="right" onClick={() => setOpen(true)}>
        <HistoryMark icon={faRightLeft} />
      </LedaMenuButton>
      <SwapHistoryDialog open={open} close={() => setOpen(false)} swap={swap} />
    </>
  )
}
