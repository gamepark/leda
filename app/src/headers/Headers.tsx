import { RuleId } from '@gamepark/leda/rules/RuleId'
import { ComponentType } from 'react'
import { ChooseActionHeader } from './ChooseActionHeader'
import { ChooseClanHeader } from './ChooseClanHeader'
import { MulliganHeader } from './MulliganHeader'

export const Headers: Partial<Record<RuleId, ComponentType>> = {
  [RuleId.ChooseClan]: ChooseClanHeader,
  [RuleId.Mulligan]: MulliganHeader,
  [RuleId.ChooseAction]: ChooseActionHeader
}
