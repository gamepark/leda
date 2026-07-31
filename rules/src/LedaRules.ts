import {
  hideFront,
  hideFrontToOthers,
  hideItemId,
  MaterialGame,
  MaterialMove,
  PositiveSequenceStrategy,
  SecretMaterialRules,
  TimeLimit
} from '@gamepark/rules-api'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { ChooseActionRule } from './rules/ChooseActionRule'
import { ChooseClanRule } from './rules/ChooseClanRule'
import { MulliganRule } from './rules/MulliganRule'
import { RuleId } from './rules/RuleId'

/**
 * This class implements the rules of the board game.
 * It must follow Game Park "Rules" API so that the Game Park server can enforce the rules.
 */
export class LedaRules
  extends SecretMaterialRules<number, MaterialType, LocationType>
  implements TimeLimit<MaterialGame<number, MaterialType, LocationType>, MaterialMove<number, MaterialType, LocationType>, number>
{
  rules = {
    [RuleId.ChooseClan]: ChooseClanRule,
    [RuleId.Mulligan]: MulliganRule,
    [RuleId.ChooseAction]: ChooseActionRule
  }

  /**
   * What is face down on the table, and what a player holds in hand.
   * Hiding is what makes a face down pile actually face down: without it the ids travel to the clients, which could
   * read the order of a pile, and a Shuffle would be sent with its result, which the client cannot predict.
   * A hand is secret rather than hidden: its owner sees it, the opponent does not.
   *
   * The Action tiles and the Military Victory tokens all share one back, so hiding their whole id is enough.
   * A clan card does not: only its front is hidden, so that the clan it belongs to survives and its back can still
   * be drawn. That is what the composite id of {@link ClanCardItemId} is for.
   */
  hidingStrategies = {
    [MaterialType.ActionTile]: {
      [LocationType.ActionTileDeck]: hideItemId
    },
    [MaterialType.MilitaryVictoryToken]: {
      [LocationType.MilitaryVictoryDeck]: hideItemId
    },
    [MaterialType.ClanCard]: {
      [LocationType.PlayerDeck]: hideFront,
      [LocationType.PlayerHand]: hideFrontToOthers
    }
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
