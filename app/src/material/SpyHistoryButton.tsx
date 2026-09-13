import { faEye } from '@fortawesome/free-solid-svg-icons'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { isPileTop, isSpyOnEgg, isSpyOnPile } from '@gamepark/leda/rules/spy'
import { useRules } from '@gamepark/react-game'
import { useState } from 'react'
import { EggSpyHistoryDialog, SpyHistoryDialog } from '../dialogs/SpyHistoryDialog'
import { SeenPileSpy, useRoundSpies } from '../history/spiedLooks'
import { HistoryMark } from './HistoryMark'
import { LedaMenuButton } from './LedaMenuButton'
import { spyButtonX } from './spiedItem'
import { tileButtonPosition } from './tileButtonPosition'

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
 * in the memory of the game and in the history of the moves, so the pile it hangs on never changes when it does.
 * And through {@link useRules} rather than the guarded reading the buttons that play a move need: this one plays
 * none, and a spectator, who has no seat and therefore no move to play, is entitled to it like anybody else.
 */
export const SpyHistoryButton = ({ type, index, player }: { type: MaterialType; index: number; player?: number }) => {
  const rules = useRules<LedaRules>()
  const roundSpies = useRoundSpies()
  const [open, setOpen] = useState(false)

  if (rules === undefined) return null
  const spies = roundSpies.filter((spy): spy is SeenPileSpy => isSpyOnPile(spy, type, player))
  if (spies.length === 0 || !isPileTop(rules, type, index, player)) return null

  return (
    <>
      <LedaMenuButton x={-spyButtonX(type)} labelPosition="left" onClick={() => setOpen(true)}>
        <HistoryMark icon={faEye} />
      </LedaMenuButton>
      <SpyHistoryDialog open={open} close={() => setOpen(false)} spies={spies} />
    </>
  )
}

/**
 * The same mark on a card of a grid that a Spy read while it was an Egg: nothing on the table says that its front
 * was seen, and the card carries it for the rest of the round wherever it goes from there, hatched or not.
 * On the right edge of the square, under the corner the marks of a swap and of a lock sit in, and away from the
 * corner the buttons of the square sit in (see {@link tileButtonPosition}).
 */
export const EggSpyHistoryButton = ({ index }: { index: number }) => {
  const roundSpies = useRoundSpies()
  const [open, setOpen] = useState(false)

  // An Egg is read once a round at most, so there is one Spy to find (see {@link spiableEggs}).
  const spy = roundSpies.find((spy) => isSpyOnEgg(spy, index))
  if (spy === undefined) return null

  return (
    <>
      <LedaMenuButton x={-tileButtonPosition.x} y={0} labelPosition="right" onClick={() => setOpen(true)}>
        <HistoryMark icon={faEye} />
      </LedaMenuButton>
      <EggSpyHistoryDialog open={open} close={() => setOpen(false)} spy={spy} />
    </>
  )
}
