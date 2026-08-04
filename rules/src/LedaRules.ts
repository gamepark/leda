import {
  hideFront,
  hideFrontToOthers,
  hideItemId,
  hideItemIdToOthers,
  ItemMove,
  MaterialGame,
  MaterialMove,
  PlayMoveContext,
  PositiveSequenceStrategy,
  SecretMaterialRules,
  TimeLimit
} from '@gamepark/rules-api'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { ActivateAndUpgradeTileRule } from './rules/ActivateAndUpgradeTileRule'
import { ActivateCardRule } from './rules/ActivateCardRule'
import { ActivateZoneRule } from './rules/ActivateZoneRule'
import { AwakeningRule } from './rules/AwakeningRule'
import { ChooseActionRule } from './rules/ChooseActionRule'
import { ChooseEffectRule } from './rules/ChooseEffectRule'
import { EndOfRoundRule } from './rules/EndOfRoundRule'
import { FlipDesertRule } from './rules/FlipDesertRule'
import { MilitaryConflictRule } from './rules/MilitaryConflictRule'
import { MilitaryVictoryRule } from './rules/MilitaryVictoryRule'
import { ChooseClanRule } from './rules/ChooseClanRule'
import { MulliganRule } from './rules/MulliganRule'
import { OrganisationRule } from './rules/OrganisationRule'
import { PlaceSharkTokenRule } from './rules/PlaceSharkTokenRule'
import { PlayCardRule } from './rules/PlayCardRule'
import { RedrawMilitaryVictoryRule } from './rules/RedrawMilitaryVictoryRule'
import { RuleId } from './rules/RuleId'
import { TriggerMilitaryVictoryRule } from './rules/TriggerMilitaryVictoryRule'
import { sharkMoves } from './rules/sharkPack'
import { SpyRule } from './rules/SpyRule'
import { StartOrganisationRule } from './rules/StartOrganisationRule'
import { UpgradeTileRule } from './rules/UpgradeTileRule'

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
    [RuleId.ChooseAction]: ChooseActionRule,
    [RuleId.ActivateZone]: ActivateZoneRule,
    [RuleId.MilitaryConflict]: MilitaryConflictRule,
    [RuleId.StartOrganisation]: StartOrganisationRule,
    [RuleId.Organisation]: OrganisationRule,
    [RuleId.EndOfRound]: EndOfRoundRule,
    [RuleId.UpgradeTile]: UpgradeTileRule,
    [RuleId.FlipDesert]: FlipDesertRule,
    [RuleId.Spy]: SpyRule,
    [RuleId.ChooseEffect]: ChooseEffectRule,
    [RuleId.PlayCard]: PlayCardRule,
    [RuleId.ActivateCard]: ActivateCardRule,
    [RuleId.ActivateAndUpgradeTile]: ActivateAndUpgradeTileRule,
    [RuleId.MilitaryVictory]: MilitaryVictoryRule,
    [RuleId.RedrawMilitaryVictory]: RedrawMilitaryVictoryRule,
    [RuleId.TriggerMilitaryVictory]: TriggerMilitaryVictoryRule,
    [RuleId.PlaceSharkToken]: PlaceSharkTokenRule,
    [RuleId.Awakening]: AwakeningRule
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
   *
   * An item a Spy effect took off a pile is secret the same way a hand is: whoever took it sees it, and nobody
   * else does. That is the whole of the effect, so it needs an entry for each of the 3 piles it can look into.
   */
  hidingStrategies = {
    [MaterialType.ActionTile]: {
      [LocationType.ActionTileDeck]: hideItemId,
      [LocationType.SpiedItem]: hideItemIdToOthers
    },
    [MaterialType.MilitaryVictoryToken]: {
      [LocationType.MilitaryVictoryDeck]: hideItemId,
      [LocationType.SpiedItem]: hideItemIdToOthers
    },
    [MaterialType.ClanCard]: {
      [LocationType.PlayerDeck]: hideFront,
      [LocationType.PlayerHand]: hideFrontToOthers,
      [LocationType.SpiedItem]: hideFrontToOthers
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

  /**
   * Two tiles of a grid can show the same face, and the 2 tiles of a swap sit on the same square for as long as
   * the first half of the move lasts (see {@link OrganisationRule}): without this they would merge into a single
   * item with a quantity of 2, which would take with it the index the cards played on the square point to.
   * Everything else keeps the default: the Food and the Shark tokens are counted rather than laid out one by one,
   * and what is hidden cannot merge anyway.
   */
  itemsCanMerge(type: MaterialType): boolean {
    return type !== MaterialType.Tile && super.itemsCanMerge(type)
  }

  /**
   * The Pack of the Sharks is a rule of the board and not of any one step of it: a Shark card played takes a
   * token, and a token whose square stops being surrounded slides back over the effect it was covering, whichever
   * rule moved the card, the token or the tile under them (see {@link sharkMoves}).
   * Hence this hook rather than the same call written into every rule that plays a card or swaps 2 squares.
   *
   * What the board owes comes first, before what the rule that was playing has to say: a card played is the end of
   * an organisation, and a round handed over before its tokens are placed would open the next one in the middle of
   * settling the last.
   */
  protected afterItemMove(
    move: ItemMove<number, MaterialType, LocationType>,
    context?: PlayMoveContext
  ): MaterialMove<number, MaterialType, LocationType>[] {
    return [...sharkMoves(this, move), ...super.afterItemMove(move, context)]
  }

  giveTime(): number {
    return 60
  }
}
