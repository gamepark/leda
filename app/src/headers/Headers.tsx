import { RuleId } from '@gamepark/leda/rules/RuleId'
import { ComponentType } from 'react'
import { ActivateZoneHeader } from './ActivateZoneHeader'
import { ChooseActionHeader } from './ChooseActionHeader'
import { ChooseClanHeader } from './ChooseClanHeader'
import { FlipDesertHeader } from './FlipDesertHeader'
import { MulliganHeader } from './MulliganHeader'
import { SpyHeader } from './SpyHeader'
import { UpgradeTileHeader } from './UpgradeTileHeader'

export const Headers: Partial<Record<RuleId, ComponentType>> = {
  [RuleId.ChooseClan]: ChooseClanHeader,
  [RuleId.Mulligan]: MulliganHeader,
  [RuleId.ChooseAction]: ChooseActionHeader,
  [RuleId.ActivateZone]: ActivateZoneHeader,

  /** The rules an effect opens are not steps of a round, hence apart, like in {@link RuleId}. */
  [RuleId.UpgradeTile]: UpgradeTileHeader,
  [RuleId.FlipDesert]: FlipDesertHeader,
  [RuleId.Spy]: SpyHeader
}
