import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { HeaderText, ThemeButton, useGame, usePlayerId, useRules } from '@gamepark/react-game'
import { MaterialGame } from '@gamepark/rules-api'
import { useState } from 'react'
import { ChooseClanDialog } from '../dialogs/ChooseClanDialog'

export const ChooseClanHeader = () => {
  const rules = useRules()
  const me = usePlayerId<number>()
  // Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
  const itIsMyTurn = me !== undefined && rules?.getActivePlayer() === me

  if (!itIsMyTurn) {
    return <HeaderText code="choose-clan" />
  }
  return <MyTurnToChoose me={me} />
}

/**
 * The dialog is hosted here rather than in App: it belongs to this step of the rules, which is exactly how long
 * this header is displayed. The header doubles as the way back to it once it has been dismissed, through the
 * <reopen> tag of the translation.
 * Whether it was dismissed is state of its own component, so it is forgotten when the turn to choose ends.
 *
 * Two things close it besides being dismissed:
 * - a clan being read, and for exactly as long as it is: the 2 dialogs are portalled to the same root with the
 *   same z-index, so which of them is drawn on top is decided by the order they happened to mount in, and the
 *   choice would sometimes cover the clan it was asked to show. Stepping aside rather than being dismissed means
 *   closing the clan again lands back on the choice, with nothing to reopen.
 * - a clan having been taken, which is what the Victory condition card of the player marks: taking one creates a
 *   deck, shuffles it and draws from it, and the header only goes away once all of that has finished animating,
 *   which is far too late for a dialog that has nothing left to offer.
 */
const MyTurnToChoose = ({ me }: { me: number }) => {
  const [dismissed, setDismissed] = useState(false)
  const reading = useGame<MaterialGame>()?.helpDisplay !== undefined
  const rules = useRules<LedaRules>()
  const chosen = (rules?.material(MaterialType.VictoryConditionCard).player(me).length ?? 0) > 0
  return (
    <>
      <HeaderText code="choose-clan" components={{ reopen: <ThemeButton onClick={() => setDismissed(false)} /> }} />
      <ChooseClanDialog open={!dismissed && !reading && !chosen} close={() => setDismissed(true)} />
    </>
  )
}
