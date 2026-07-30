import { MaterialGameSetup } from '@gamepark/rules-api'
import { LedaOptions } from './LedaOptions'
import { LedaRules } from './LedaRules'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { RuleId } from './rules/RuleId'

/**
 * This class creates a new Game based on the game options
 */
export class LedaSetup extends MaterialGameSetup<number, MaterialType, LocationType, LedaOptions> {
  Rules = LedaRules

  setupMaterial(_options: LedaOptions) {
    // TODO
  }

  start() {
    this.startPlayerTurn(RuleId.TheFirstStep, this.players[0])
  }
}
