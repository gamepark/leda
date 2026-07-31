import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { putBackMoves } from '@gamepark/leda/rules/spy'
import { usePlayerId, useRules } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { LedaMenuButton } from './LedaMenuButton'
import { spyButtonX } from './spiedItem'

/**
 * The two buttons the item a Spy effect took off a pile carries: back on top of it, or under it.
 * The moves come from the same helper the rule offers them with, so a button can never name the other's move.
 */
export const SpiedItemButtons = ({ type }: { type: MaterialType }) => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  const { t } = useTranslation()

  // Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
  if (!rules || me === undefined || rules.getActivePlayer() !== me) return null
  if (rules.game.rule?.id !== RuleId.Spy) return null
  const back = putBackMoves(rules, me)
  if (back === undefined) return null

  const x = spyButtonX(type)
  return (
    <>
      <LedaMenuButton move={back.onTop} label={t('spy.on-top')} x={x} y={-2} labelPosition="right">
        <FontAwesomeIcon icon={faArrowUp} />
      </LedaMenuButton>
      <LedaMenuButton move={back.under} label={t('spy.under')} x={x} y={2} labelPosition="right">
        <FontAwesomeIcon icon={faArrowDown} />
      </LedaMenuButton>
    </>
  )
}
