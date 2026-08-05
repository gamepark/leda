import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { putBackMoves } from '@gamepark/leda/rules/spy'
import { useTranslation } from 'react-i18next'
import { LedaMenuButton } from './LedaMenuButton'
import { useMenuButtonRules } from './menuButtons'
import { spyButtonX } from './spiedItem'

/**
 * The two buttons the item a Spy effect took off a pile carries: back on top of it, or under it.
 * The moves come from the same helper the rule offers them with, so a button can never name the other's move.
 */
export const SpiedItemButtons = ({ type }: { type: MaterialType }) => {
  const context = useMenuButtonRules()
  const { t } = useTranslation()

  if (context === undefined) return null
  const { rules, player: me } = context
  if (rules.getActivePlayer() !== me) return null
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
