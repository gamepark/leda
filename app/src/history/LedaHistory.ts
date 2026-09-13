import { Clan } from '@gamepark/leda/Clan'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { TileId } from '@gamepark/leda/material/TileId'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { playerClan } from '@gamepark/leda/rules/specialActivation'
import { isSnakeCard, isSpiedEgg } from '@gamepark/leda/rules/snake'
import { isSpyLook } from '@gamepark/leda/rules/spy'
import { isGridSettled } from '@gamepark/leda/rules/swap'
import { LogDescription, MoveComponentContext, MovePlayedLogDescription } from '@gamepark/react-game'
import {
  isCreateItemType,
  isCustomMoveType,
  isDeleteItemType,
  isMoveItem,
  isMoveItemType,
  isStartPlayerTurn,
  isStartRule,
  MaterialGame,
  MaterialItem,
  MaterialMove,
  MoveItem
} from '@gamepark/rules-api'
import { clanLogCss } from './logCss'
import { ActivateSquareLog, ChooseEffectLog, PassLog } from './log/ActivateLogs'
import { AwakenLog, PayCardLog, PlaceRingLog, PlayCardLog, RotateCatCardLog, SearchRingLog, SpendRingLog } from './log/CardLogs'
import { AwakeningLostLog, DrawLog, FoodGainLog, FoodSpendLog, OrganisationFoodLog, StealFoodLog } from './log/ResourceLogs'
import { ChooseActionLog, ConflictLog, RevealActionTileLog } from './log/RoundLogs'
import { ChooseClanLog, MulliganLog } from './log/SetupLogs'
import { FlipSnakeToEggLog, HatchedSnakeLog, HatchEggLog, MoveEggLog, SpyEggLog, SpyEggReturnLog } from './log/SnakeLogs'
import { SpyLog, SpyReturnLog } from './log/SpyLogs'
import { DowngradeTileLog, FlipDesertLog, SwapSquaresLog, UpgradeTileLog } from './log/TileLogs'
import { PlaceSharkTokenLog, RedrawTokenLog, TriggerTokenLog, WinTokenLog } from './log/TokenLogs'

type Game = MaterialGame<number, MaterialType, LocationType>
type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What the journal writes down, move by move.
 *
 * Every entry is read off the move and off the state it was played on, and never off anything remembered for the
 * journal: the rules write nothing for it, so a rule that changes cannot leave a journal saying what the game no
 * longer does.
 *
 * Two levels, and only two: what a player is asked stands on the left with their avatar next to it, and what it
 * gave them is indented under it. So a round reads as the handful of decisions it is made of, with the Food, the
 * cards and the tokens they were worth underneath.
 *
 * A move that says nothing a player could not already see is left out: a temporary tile turning into a Desert as
 * it is activated, a deck being shuffled, the cards of a mulligan going back into it. Every one of them is the
 * visible half of a move that is already written down.
 */
export class LedaHistory implements LogDescription<Move, number, Game> {
  getMovePlayedLogDescription(move: Move, context: MoveComponentContext<Move, number, Game>): MovePlayedLogDescription | undefined {
    const game = context.game
    const rules = new LedaRules(game)
    const ruleId = game.rule?.id
    const player = game.rule?.player

    /**
     * A Spy first, before the piles it looks into: an item going back into a deck is the very move a price paid in
     * cards makes, and the one thing that tells them apart is where the item is coming from.
     */
    if (isMoveItem(move)) {
      const item = rules.material(move.itemType).getItem(move.itemIndex)
      if (move.location.type === LocationType.SpiedItem) return this.entry(SpyLog, rules, move.location.player, 1)
      if (item?.location.type === LocationType.SpiedItem) return this.entry(SpyReturnLog, rules, item.location.player, 1)
      // An Egg is read where it lies, turned over on its square and back: a Spy all the same, aimed at no pile.
      if (isSpyLook(move)) return this.entry(SpyEggLog, rules, player, 1)
      if (isSpiedEgg(item)) return this.entry(SpyEggReturnLog, rules, player, 1)
    }

    // --- What a player is asked, which they answer with a move of their own.

    // The clan is not taken yet on the state this was played on, so the entry takes its colour from the move itself.
    if (isCustomMoveType(CustomMoveType.ChooseClan)(move)) return { ...this.entry(ChooseClanLog, rules, player), css: clanLogCss(move.data as Clan) }
    if (isCustomMoveType(CustomMoveType.Mulligan)(move)) return this.entry(MulliganLog, rules, move.data as number)
    // Keeping the hand drawn is a decision of its own; turning down what an effect offered is only its outcome.
    if (isCustomMoveType(CustomMoveType.Pass)(move)) {
      // Keeping the hand drawn and being done with a zone are decisions of a turn; turning down what an effect
      // offered is only the outcome of the entry above it.
      const ownTurn = ruleId === RuleId.Mulligan || ruleId === RuleId.ActivateZone
      return this.entry(PassLog, rules, (move.data as number | undefined) ?? player, ownTurn ? 0 : 1)
    }
    if (isCustomMoveType(CustomMoveType.ChooseAction)(move)) return this.entry(ChooseActionLog, rules, player)
    // The zone of the round is what a player spends their phase 1 on; every other square is asked for by an effect.
    if (isCustomMoveType(CustomMoveType.ActivateSquare)(move)) {
      return this.entry(ActivateSquareLog, rules, player, ruleId === RuleId.ActivateZone ? 0 : 1)
    }
    if (isCustomMoveType(CustomMoveType.ChooseEffect)(move)) return this.entry(ChooseEffectLog, rules, player, 1)
    if (isCustomMoveType(CustomMoveType.RotateCatCard)(move)) return this.entry(RotateCatCardLog, rules, player, 1)
    if (isCustomMoveType(CustomMoveType.TriggerMilitaryVictory)(move)) return this.entry(TriggerTokenLog, rules, player, 1)
    if (isCustomMoveType(CustomMoveType.SearchRing)(move)) return this.entry(SearchRingLog, rules, player, 1)
    // Paying to open an Egg is what a player of the Snakes spends their phase 1 on, beside the squares of the zone.
    if (isCustomMoveType(CustomMoveType.HatchEgg)(move)) return this.entry(HatchEggLog, rules, player)

    /**
     * Phase 2 settles itself: nobody is asked anything, so what the conflict came to is read off the step it hands
     * the game over to, which is the winner's turn or the organisation (see {@link MilitaryConflictRule}).
     */
    if (ruleId === RuleId.MilitaryConflict) {
      if (isStartPlayerTurn(move) && move.id === RuleId.MilitaryVictory) return this.entry(ConflictLog, rules, move.player)
      if (isStartRule(move) && move.id === RuleId.StartOrganisation) return this.entry(ConflictLog, rules, undefined)
    }

    // --- What the game gives, takes or moves, which is where everything else is read.

    if (isCreateItemType(MaterialType.FoodToken)(move)) {
      // The Food a clan starts with is part of taking that clan, and is already written down with it.
      if (ruleId === RuleId.ChooseClan) return undefined
      const owner = move.item.location.player
      // The only Food the Awakenings ever give is the one they turn into when none of them can be resolved.
      if (ruleId === RuleId.Awakening) return this.entry(AwakeningLostLog, rules, owner)
      return ruleId === RuleId.Organisation ? this.entry(OrganisationFoodLog, rules, owner) : this.entry(FoodGainLog, rules, owner, 1)
    }
    if (isDeleteItemType(MaterialType.FoodToken)(move)) {
      return this.entry(FoodSpendLog, rules, rules.material(MaterialType.FoodToken).getItem(move.itemIndex)?.location.player, 1)
    }
    // The one thing that ever moves Food is taking it from the opponent: it is created and deleted everywhere else.
    if (isMoveItemType(MaterialType.FoodToken)(move)) return this.entry(StealFoodLog, rules, move.location.player, 1)

    if (isMoveItemType(MaterialType.ClanCard)(move)) {
      const card = rules.material(MaterialType.ClanCard).getItem(move.itemIndex)
      switch (move.location.type) {
        case LocationType.PlayedCard:
          // A card that was already in play is not being played: it is changing squares, or changing sides.
          if (card?.location.type === LocationType.PlayedCard) return this.movedInPlay(move, card, rules)
          if (ruleId === RuleId.Awakening) return this.entry(AwakenLog, rules, move.location.player, 1)
          if (ruleId === RuleId.PlaceRing) return this.entry(PlaceRingLog, rules, move.location.player, 1)
          // Playing a card is the whole of an organisation; an effect letting a player play one is not.
          return this.entry(PlayCardLog, rules, move.location.player, ruleId === RuleId.Organisation ? 0 : 1)
        case LocationType.RevealedCard:
          /**
           * A Ring shown to both players before it goes where it is going. The one traded for a token is written
           * down here, on the move that reveals it, and not on the one that puts it under the deck: that is the
           * move everybody reads it on (see {@link SpendRingForTokenRule}).
           * A Ring searched for has already been written down by the move that named it (see {@link SearchRingLog}).
           */
          return ruleId === RuleId.SpendRingForToken ? this.entry(SpendRingLog, rules, move.location.player, 1) : undefined
        case LocationType.PlayerHand:
          // The Panda an Awakening sends back to its owner, which is the other half of a move already written down.
          if (card?.location.type !== LocationType.PlayerDeck) return undefined
          // The cards of a setup or of a mulligan belong to the entries of those.
          if (ruleId === RuleId.Mulligan || ruleId === RuleId.ChooseClan) return undefined
          return this.entry(DrawLog, rules, move.location.player, 1)
        case LocationType.PlayerDeck:
          // A Ring going under the deck it was shown from, which the reveal above has already written down.
          if (card?.location.type === LocationType.RevealedCard) return undefined
          if (ruleId === RuleId.PayCardCost) return this.entry(PayCardLog, rules, move.location.player, 1)
          return undefined
      }
      return undefined
    }

    if (isMoveItemType(MaterialType.Tile)(move)) {
      const tile = rules.material(MaterialType.Tile).getItem<TileId>(move.itemIndex)
      const owner = tile?.location.player
      if (tile === undefined || owner === undefined) return undefined
      if (move.location.x !== tile.location.x || move.location.y !== tile.location.y) {
        // A swap is 2 moves, and only the first is a swap: the second is the tile it displaced going the other way,
        // which is what a grid holding 2 tiles on one square says (see {@link isGridSettled}).
        if (!isGridSettled(rules, owner)) return undefined
        return this.entry(SwapSquaresLog, rules, owner, ruleId === RuleId.Organisation ? 0 : 1)
      }
      switch (ruleId) {
        case RuleId.UpgradeTile:
        case RuleId.UpgradeAndActivateTile:
        case RuleId.ActivateAndUpgradeTile:
          return this.entry(UpgradeTileLog, rules, owner, 1)
        case RuleId.FlipDesert:
          return this.entry(FlipDesertLog, rules, owner, 1)
        case RuleId.DowngradeTile:
          return this.entry(DowngradeTileLog, rules, owner, 1)
      }
      // A temporary tile becoming a Desert as it is activated: the square it was on is already written down.
      return undefined
    }

    if (isMoveItemType(MaterialType.MilitaryVictoryToken)(move)) {
      if (move.location.type === LocationType.PlayerMilitaryVictory) return this.entry(WinTokenLog, rules, move.location.player, 1)
      if (move.location.type === LocationType.MilitaryVictoryDeck) {
        return this.entry(RedrawTokenLog, rules, rules.material(move.itemType).getItem(move.itemIndex)?.location.player, 1)
      }
      return undefined
    }

    if (isMoveItemType(MaterialType.SharkToken)(move) && move.location.type === LocationType.PlacedSharkToken) {
      return this.entry(PlaceSharkTokenLog, rules, move.location.player, 1)
    }

    // The Action tile of the round turned face up, which is where a round begins.
    if (isMoveItemType(MaterialType.ActionTile)(move) && move.location.type === LocationType.ActionTileRevealed) {
      return this.entry(RevealActionTileLog, rules, player)
    }

    return undefined
  }

  /**
   * A card of a grid that moves without leaving it, which only the Snakes and the Cats ever do: an Egg laid on
   * another square, an Egg turned onto its Snake side or a Snake turned back onto its Egg side, and the half turn
   * a Cat card takes as it is activated (see {@link snake}, {@link Effect.HalfTurn}).
   *
   * The half turn says nothing the entry of the activation it comes from does not already say, so it is left out,
   * exactly as the Desert a temporary tile becomes is.
   */
  private movedInPlay(move: MoveItem<number, MaterialType, LocationType>, card: MaterialItem<number, LocationType>, rules: LedaRules) {
    const owner = move.location.player
    if (move.location.parent !== card.location.parent) return this.entry(MoveEggLog, rules, owner)
    if (!isSnakeCard(card)) return undefined
    return move.location.rotation === true ? this.entry(HatchedSnakeLog, rules, owner, 1) : this.entry(FlipSnakeToEggLog, rules, owner, 1)
  }

  /**
   * One entry, in the colour of the clan of the player it belongs to (see {@link clanLogCss}).
   *
   * The avatar is drawn on the entries of the first level alone: an indented one is the outcome of the entry above
   * it, and it names its player in words anyway, a player gaining what somebody else's effect gave them being a
   * thing this game does (see {@link Effect.FlipOpponentTile}).
   */
  private entry(Component: MovePlayedLogDescription['Component'], rules: LedaRules, player?: number, depth = 0): MovePlayedLogDescription {
    const clan = player === undefined ? undefined : playerClan(rules, player)
    return { Component, player: depth === 0 ? player : undefined, depth, css: clanLogCss(clan), liveCss: true }
  }
}
