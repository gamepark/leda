import { MaterialGame, MaterialMove, MaterialRules, PositiveSequenceStrategy, TimeLimit } from '@gamepark/rules-api'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { ChooseClanRule } from './rules/ChooseClanRule'
import { RuleId } from './rules/RuleId'

/**
 * This class implements the rules of the board game.
 * It must follow Game Park "Rules" API so that the Game Park server can enforce the rules.
 */
export class LedaRules
  extends MaterialRules<number, MaterialType, LocationType>
  implements TimeLimit<MaterialGame<number, MaterialType, LocationType>, MaterialMove<number, MaterialType, LocationType>, number>
{
  rules = {
    [RuleId.ChooseClan]: ChooseClanRule
  }

  /**
   * Piles and hands number their items, so that they keep an order and stay distinct items.
   * Without it, identical items sharing a location would merge into a single item with a quantity, which is what
   * we do want for the Food and the Shark tokens, but not for a pile we draw from.
   * PlayerGrid is left out on purpose: x and y are the coordinates of a square there.
   */
  locationsStrategies = {
    [MaterialType.ActionTile]: {
      [LocationType.ActionTileDeck]: new PositiveSequenceStrategy(),
      [LocationType.ActionTileRevealed]: new PositiveSequenceStrategy()
    },
    [MaterialType.MilitaryVictoryToken]: {
      [LocationType.MilitaryVictoryDeck]: new PositiveSequenceStrategy(),
      [LocationType.PlayerMilitaryVictory]: new PositiveSequenceStrategy()
    },
    [MaterialType.ClanCard]: {
      [LocationType.PlayerDeck]: new PositiveSequenceStrategy(),
      [LocationType.PlayerHand]: new PositiveSequenceStrategy()
    }
  }

  giveTime(): number {
    return 60
  }
}
