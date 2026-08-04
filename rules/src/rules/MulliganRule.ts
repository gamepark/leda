import { CustomMove, isCustomMoveType, isMoveItemTypeAtOnce, ItemMove, MaterialMove, SimultaneousRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { RuleId } from './RuleId'

/**
 * End of setup step 6: a player who is not happy with the cards they drew may shuffle them back into their deck and
 * draw as many again. Both players decide at the same time, since one has nothing to learn from the other.
 * The rulebook allows it once only, which needs nothing here: a player who has decided is no longer active, so they
 * are never offered the choice again.
 */
export class MulliganRule extends SimultaneousRule<number, MaterialType, LocationType> {
  /**
   * The moves carry the player they belong to. The framework only accepts from a player the moves this function
   * returned for them, so a player cannot mulligan on behalf of the other.
   */
  getActivePlayerLegalMoves(player: number) {
    return [this.customMove(CustomMoveType.Mulligan, player), this.customMove(CustomMoveType.Pass, player)]
  }

  onCustomMove(move: CustomMove): MaterialMove<number, MaterialType, LocationType>[] {
    // Passing here is keeping the hand that was drawn, which ends the setup of that player.
    if (isCustomMoveType<CustomMoveType, number>(CustomMoveType.Pass)(move)) return [this.endPlayerTurn(move.data!)]
    if (!isCustomMoveType<CustomMoveType, number>(CustomMoveType.Mulligan)(move)) return []
    // The hand goes back in one move, so that afterItemMove has a single event to react to. The deck cannot be
    // shuffled here anyway: these consequences are all built before any of them is played, so a shuffle would not
    // include the cards that are on their way back.
    return [this.hand(move.data!).moveItemsAtOnce({ type: LocationType.PlayerDeck, player: move.data })]
  }

  /** Runs once a hand is back in its deck: shuffle it, then draw as many cards as were put back. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): MaterialMove<number, MaterialType, LocationType>[] {
    if (!isMoveItemTypeAtOnce(MaterialType.ClanCard)(move)) return []
    const player = move.location.player!
    return [
      this.deck(player).shuffle(),
      ...this.deck(player).limit(move.indexes.length).moveItems({ type: LocationType.PlayerHand, player }),
      this.endPlayerTurn(player)
    ]
  }

  hand(player: number) {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(player)
  }

  /** deck() draws from the highest x, which is the top of the pile the DeckLocator stacks. */
  deck(player: number) {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(player).deck()
  }

  /** The setup is over. The first round begins, and the first player is the active one. */
  getMovesAfterPlayersDone() {
    return [this.startPlayerTurn(RuleId.ChooseAction, this.game.players[0])]
  }
}
