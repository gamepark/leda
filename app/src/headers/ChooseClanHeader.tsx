import { HeaderText, ThemeButton, usePlayerId, useRules } from '@gamepark/react-game'
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
  return <MyTurnToChoose />
}

/**
 * The dialog is hosted here rather than in App: it belongs to this step of the rules, which is exactly how long
 * this header is displayed. The header doubles as the way back to it once it has been dismissed, through the
 * <reopen> tag of the translation.
 * Whether it was dismissed is state of its own component, so it is forgotten when the turn to choose ends.
 */
const MyTurnToChoose = () => {
  const [dismissed, setDismissed] = useState(false)
  return (
    <>
      <HeaderText code="choose-clan" components={{ reopen: <ThemeButton onClick={() => setDismissed(false)} /> }} />
      <ChooseClanDialog open={!dismissed} close={() => setDismissed(true)} />
    </>
  )
}
