import { RuleId } from '@gamepark/leda/rules/RuleId'
import { ComponentType } from 'react'
import { ActivateZoneHeader } from './ActivateZoneHeader'
import { AwakeningHeader } from './AwakeningHeader'
import { ChooseActionHeader } from './ChooseActionHeader'
import { ChooseClanHeader } from './ChooseClanHeader'
import { FlipDesertHeader } from './FlipDesertHeader'
import { MulliganHeader } from './MulliganHeader'
import { OrganisationHeader } from './OrganisationHeader'
import { PandaSpecialActivationHeader } from './PandaSpecialActivationHeader'
import { SpyHeader } from './SpyHeader'
import { UpgradeTileHeader } from './UpgradeTileHeader'

export const Headers: Partial<Record<RuleId, ComponentType>> = {
  [RuleId.ChooseClan]: ChooseClanHeader,
  [RuleId.Mulligan]: MulliganHeader,
  [RuleId.ChooseAction]: ChooseActionHeader,
  [RuleId.ActivateZone]: ActivateZoneHeader,
  [RuleId.Organisation]: OrganisationHeader,

  /** What no round goes through is apart, like in {@link RuleId}: the rules an effect opens, then those of a clan. */
  [RuleId.UpgradeTile]: UpgradeTileHeader,
  [RuleId.FlipDesert]: FlipDesertHeader,
  [RuleId.Spy]: SpyHeader,
  [RuleId.PandaSpecialActivation]: PandaSpecialActivationHeader,
  [RuleId.Awakening]: AwakeningHeader
}
