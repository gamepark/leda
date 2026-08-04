import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { ItemContext, MaterialContext, TokenDescription } from '@gamepark/react-game'
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
import { MilitaryVictoryTokenButtons } from './MilitaryVictoryTokenButtons'
import { isSpiedByOther } from './spiedItem'
import { SpiedItemButtons } from './SpiedItemButtons'
import { SpyPileButton } from './SpyPileButton'

/** The 18 Military Victory tokens. */
export class MilitaryVictoryTokenDescription extends TokenDescription<number, MaterialType, LocationType, MilitaryVictoryTokenId> {
  width = 4.36
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

  /** The pile between the players is face down. A token a player has won is face up, and so is a spied one. */
  isFlipped(item: Partial<MaterialItem<number, LocationType, MilitaryVictoryTokenId>>, context: MaterialContext) {
    return item.location?.type === LocationType.MilitaryVictoryDeck || isSpiedByOther(item.location, context)
  }

  /** The pile and the spied token carry the buttons of a Spy effect, which decide on their own whether to show. */
  menuAlwaysVisible = true

  getItemMenu(item: MaterialItem<number, LocationType, MilitaryVictoryTokenId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type === LocationType.SpiedItem) return <SpiedItemButtons type={MaterialType.MilitaryVictoryToken} />
    if (item.location.type === LocationType.PlayerMilitaryVictory) return <MilitaryVictoryTokenButtons index={context.index} />
    if (item.location.type !== LocationType.MilitaryVictoryDeck) return
    return <SpyPileButton type={MaterialType.MilitaryVictoryToken} index={context.index} />
  }
}
