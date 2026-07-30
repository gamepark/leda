import { ThemeButton, useLegalMoves, usePlayerName, useRules } from '@gamepark/react-game'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChooseClanDialog } from '../dialogs/ChooseClanDialog'

export const ChooseClanHeader = () => {
  const { t } = useTranslation()
  const rules = useRules()
  const activePlayer = rules?.getActivePlayer()
  const activePlayerName = usePlayerName(activePlayer)
  const itIsMyTurn = useLegalMoves().length > 0

  if (!itIsMyTurn) {
    return <>{t('header.choose-clan.player', { player: activePlayerName })}</>
  }
  return <MyTurnToChoose />
}

/**
 * The dialog is hosted here rather than in App: it belongs to this step of the rules, which is exactly how long
 * this header is displayed. The header doubles as the way back to it once it has been dismissed.
 * Whether it was dismissed is state of its own component, so it is forgotten when the turn to choose ends.
 */
const MyTurnToChoose = () => {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)
  return (
    <>
      <ThemeButton onClick={() => setDismissed(false)}>{t('header.choose-clan.you')}</ThemeButton>
      <ChooseClanDialog open={!dismissed} close={() => setDismissed(true)} />
    </>
  )
}
