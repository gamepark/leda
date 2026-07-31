import { CustomMove, isCustomMoveType, MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { ActionTileId } from '../material/ActionTileId'
import { actionTileZones, ActionZone, revealedActionTile } from '../material/ActionZone'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * Phase 1 of a round: the active player reveals the top Action tile of the pile, then picks one of the zones of
 * 4 squares it offers. The zone is remembered, since both players then activate it in their own grid.
 */
export class ChooseActionRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  /**
   * Revealing is not a choice, so it happens as the rule starts rather than as a move of the player.
   * This is also where a round begins, hence the two counters that are reset here.
   * TODO: once the 4th Action tile has been revealed, all 5 are shuffled back into the pile.
   */
  onRuleStart(): MaterialMove<number, MaterialType, LocationType>[] {
    this.memorize(Memory.RoundPlayer, this.player)
    for (const player of this.game.players) {
      this.memorize(Memory.MilitarySymbols, 0, player)
    }
    return [...this.deck.limit(1).moveItems({ type: LocationType.ActionTileRevealed })]
  }

  getPlayerMoves() {
    const tile = this.revealedTile
    if (tile === undefined) return []
    return actionTileZones[tile].map((zone) => this.customMove(CustomMoveType.ChooseAction, zone))
  }

  onCustomMove(move: CustomMove): MaterialMove<number, MaterialType, LocationType>[] {
    if (!isCustomMoveType<CustomMoveType, ActionZone>(CustomMoveType.ChooseAction)(move)) return []
    if (move.data === undefined) return []
    this.memorize(Memory.ActionZone, move.data)
    // The player who picked the zone activates it first, then their opponent does the same in their own grid.
    return [this.startPlayerTurn(RuleId.ActivateZone, this.player)]
  }

  /** The pile is drawn from the lowest x, which is the top of the stack the DeckLocator draws. */
  get deck() {
    return this.material(MaterialType.ActionTile)
      .location(LocationType.ActionTileDeck)
      .sort((tile) => tile.location.x!)
  }

  get revealedTile(): ActionTileId | undefined {
    return revealedActionTile(this.material(MaterialType.ActionTile))
  }
}
