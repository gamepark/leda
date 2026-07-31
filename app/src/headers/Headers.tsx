import { RuleId } from '@gamepark/leda/rules/RuleId'
import { ComponentType } from 'react'
import { ActivateZoneHeader } from './ActivateZoneHeader'
import { ChooseActionHeader } from './ChooseActionHeader'
import { ChooseClanHeader } from './ChooseClanHeader'
import { MulliganHeader } from './MulliganHeader'
import { UpgradeTileHeader } from './UpgradeTileHeader'

export const Headers: Partial<Record<RuleId, ComponentType>> = {
  [RuleId.ChooseClan]: ChooseClanHeader,
  [RuleId.Mulligan]: MulliganHeader,
  [RuleId.ChooseAction]: ChooseActionHeader,
  [RuleId.ActivateZone]: ActivateZoneHeader,
  [RuleId.UpgradeTile]: UpgradeTileHeader
}
