import { RuleId } from '@gamepark/leda/rules/RuleId'
import { ComponentType } from 'react'
import { ActivateAndUpgradeTileHeader } from './ActivateAndUpgradeTileHeader'
import { ActivateCardHeader } from './ActivateCardHeader'
import { ActivateDesertHeader } from './ActivateDesertHeader'
import { ActivateZoneHeader } from './ActivateZoneHeader'
import { AwakeningHeader } from './AwakeningHeader'
import { ChooseActionHeader } from './ChooseActionHeader'
import { ChooseClanHeader } from './ChooseClanHeader'
import { ChooseEffectHeader } from './ChooseEffectHeader'
import { DowngradeTileHeader } from './DowngradeTileHeader'
import { FlipDesertHeader } from './FlipDesertHeader'
import { MulliganHeader } from './MulliganHeader'
import { OrganisationHeader } from './OrganisationHeader'
import { PlaceSharkTokenHeader } from './PlaceSharkTokenHeader'
import { PlayCardHeader } from './PlayCardHeader'
import { RedrawMilitaryVictoryHeader } from './RedrawMilitaryVictoryHeader'
import { SpyHeader } from './SpyHeader'
import { SwapSquaresHeader } from './SwapSquaresHeader'
import { UpgradeAndActivateTileHeader } from './UpgradeAndActivateTileHeader'
import { TriggerMilitaryVictoryHeader } from './TriggerMilitaryVictoryHeader'
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
  [RuleId.ChooseEffect]: ChooseEffectHeader,
  [RuleId.PlayCard]: PlayCardHeader,
  [RuleId.ActivateCard]: ActivateCardHeader,
  [RuleId.ActivateAndUpgradeTile]: ActivateAndUpgradeTileHeader,
  [RuleId.RedrawMilitaryVictory]: RedrawMilitaryVictoryHeader,
  [RuleId.TriggerMilitaryVictory]: TriggerMilitaryVictoryHeader,
  [RuleId.PlaceSharkToken]: PlaceSharkTokenHeader,
  [RuleId.ActivateDesert]: ActivateDesertHeader,
  [RuleId.UpgradeAndActivateTile]: UpgradeAndActivateTileHeader,
  [RuleId.DowngradeTile]: DowngradeTileHeader,
  [RuleId.SwapSquares]: SwapSquaresHeader,
  [RuleId.Awakening]: AwakeningHeader
}
