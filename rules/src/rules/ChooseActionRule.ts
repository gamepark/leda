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
   * The pile never runs out: the end of the 4th round shuffles the tiles back into it (see {@link EndOfRoundRule}).
   */
  onRuleStart(): MaterialMove<number, MaterialType, LocationType>[] {
    this.memorize(Memory.RoundPlayer, this.player)
    // A Scorpion Portal closes its own round to Military Victory tokens, and only that round.
    this.memorize(Memory.MilitaryVictoryBlocked, undefined)
    // What the piles have to show for themselves is what happened to them this round, and nothing before it.
    this.memorize(Memory.Spies, undefined)
    // The same goes for the squares that changed places while the players were organising their grids.
    this.memorize(Memory.OrganisationSwaps, undefined)
    // And for what was activated: nothing gives twice in one phase, and every round opens a phase of its own.
    this.memorize(Memory.ActivatedItems, undefined)
    for (const player of this.game.players) {
      this.memorize(Memory.MilitarySymbols, 0, player)
      this.memorize(Memory.ActivatedCells, [], player)
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

  get deck() {
    return this.material(MaterialType.ActionTile).location(LocationType.ActionTileDeck).deck()
  }

  get revealedTile(): ActionTileId | undefined {
    return revealedActionTile(this.material(MaterialType.ActionTile))
  }
}
