import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { TokenDescription } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'
import MilitaryVictoryBack from '../images/military-victory/back.png'
import MilitaryVictoryDoubleVictory from '../images/military-victory/double-victory.png'
import MilitaryVictoryDraw from '../images/military-victory/draw.png'
import MilitaryVictoryFlipDesert from '../images/military-victory/flip-desert.png'
import MilitaryVictoryFood from '../images/military-victory/food.png'
import MilitaryVictorySpy from '../images/military-victory/spy.png'
import MilitaryVictoryStealFood from '../images/military-victory/steal-food.png'
import MilitaryVictoryUpgrade from '../images/military-victory/upgrade.png'
import MilitaryVictoryVictory from '../images/military-victory/victory.png'

/** The 18 Military Victory tokens. */
export class MilitaryVictoryTokenDescription extends TokenDescription<number, MaterialType, LocationType, MilitaryVictoryTokenId> {
  width = 2.2
  ratio = 436 / 409
  transparency = true

  images = {
    [MilitaryVictoryTokenId.Victory]: MilitaryVictoryVictory,
    [MilitaryVictoryTokenId.DoubleVictory]: MilitaryVictoryDoubleVictory,
    [MilitaryVictoryTokenId.Spy]: MilitaryVictorySpy,
    [MilitaryVictoryTokenId.FlipDesert]: MilitaryVictoryFlipDesert,
    [MilitaryVictoryTokenId.Upgrade]: MilitaryVictoryUpgrade,
    [MilitaryVictoryTokenId.Food]: MilitaryVictoryFood,
    [MilitaryVictoryTokenId.StealFood]: MilitaryVictoryStealFood,
    [MilitaryVictoryTokenId.Draw]: MilitaryVictoryDraw
  }

  backImage = MilitaryVictoryBack

  /** The pile between the players is face down. A token a player has won is face up. */
  isFlipped(item: Partial<MaterialItem<number, LocationType, MilitaryVictoryTokenId>>) {
    return item.location?.type === LocationType.MilitaryVictoryDeck
  }
}
