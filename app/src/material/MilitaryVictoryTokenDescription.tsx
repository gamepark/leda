import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { ItemContext, MaterialContext, TokenDescription } from '@gamepark/react-game'
import { MaterialItem, MaterialMoveBuilder } from '@gamepark/rules-api'
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
import { MilitaryVictoryTokenHelp } from './MilitaryVictoryTokenHelp'
import { isSpiedByOther } from './spiedItem'
import { SpiedItemButtons } from './SpiedItemButtons'
import { SpyHistoryButton } from './SpyHistoryButton'
import { SpyPileButton } from './SpyPileButton'

const militaryVictoryTokenRatio = 436 / 409

/** The Military Victory token. */
export const militaryVictoryToken = {
  width: 4.36,
  height: 4.36 / militaryVictoryTokenRatio
}

/** The 18 Military Victory tokens. */
export class MilitaryVictoryTokenDescription extends TokenDescription<number, MaterialType, LocationType, MilitaryVictoryTokenId> {
  width = militaryVictoryToken.width
  ratio = militaryVictoryTokenRatio
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

  /** Clicking a token opens what it is worth, and how one is won (see {@link MilitaryVictoryTokenHelp}). */
  help = MilitaryVictoryTokenHelp

  /**
   * All but a token of the pile, which opens the help of that pile instead (see {@link MilitaryVictoryDeckHelp}):
   * the tokens of a pile are face down and shuffled, so the one on top is nothing more than the back of a token,
   * while the pile is how many are left and the 8 tokens any of them may turn out to be.
   */
  displayHelp(item: MaterialItem<number, LocationType, MilitaryVictoryTokenId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type !== LocationType.MilitaryVictoryDeck) return super.displayHelp(item, context)
    return MaterialMoveBuilder.displayLocationHelp<number, MaterialType, LocationType>({ type: LocationType.MilitaryVictoryDeck })
  }

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
    return (
      <>
        <SpyPileButton type={MaterialType.MilitaryVictoryToken} index={context.index} />
        <SpyHistoryButton type={MaterialType.MilitaryVictoryToken} index={context.index} />
      </>
    )
  }
}
