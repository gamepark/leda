import { useLegalMoves, usePlayerName, useRules } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'

export const ChooseClanHeader = () => {
  const { t } = useTranslation()
  const rules = useRules()
  const activePlayer = rules?.getActivePlayer()
  const activePlayerName = usePlayerName(activePlayer)
  const itIsMyTurn = useLegalMoves().length > 0
  if (itIsMyTurn) return <>{t('header.choose-clan.you')}</>
  return <>{t('header.choose-clan.player', { player: activePlayerName })}</>
}
