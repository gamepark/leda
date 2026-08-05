import { isMoveItemTypeAtOnce, ItemMove, MaterialMove, MaterialRulesPart } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from './Memory'
import { victorySymbols } from './militaryConflict'
import { RuleId } from './RuleId'

type Move = MaterialMove<number, MaterialType, LocationType>

/** How many rounds a pile of Action tiles lasts: the 4 tiles it reveals, the 5th one staying face down. */
const roundsPerCycle = 4

/**
 * The round is over: the player who was not the active one becomes the active player, and reveals the next
 * Action tile.
 *
 * Once the 4th tile has been revealed the cycle ends: the 5 tiles are shuffled back into a face down pile, and
 * the player who controls the fewest Victory symbols opens the next cycle instead. A tie leaves the players
 * taking turns as usual, which hands the next round to whoever opened the cycle that just ended.
 */
export class EndOfRoundRule extends MaterialRulesPart<number, MaterialType, LocationType> {
  onRuleStart(): Move[] {
    if (this.revealedTiles.length < roundsPerCycle) return [this.startPlayerTurn(RuleId.ChooseAction, this.nextRoundPlayer)]
    // The tiles go back in one move, so that afterItemMove has a single event to react to. They cannot be shuffled
    // here anyway: these consequences are all built before any of them is played, so a shuffle would leave out the
    // tiles that are on their way back.
    return [this.revealedTiles.moveItemsAtOnce({ type: LocationType.ActionTileDeck })]
  }

  /** Runs once the revealed tiles are back in the pile, which only the end of a cycle does. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemTypeAtOnce(MaterialType.ActionTile)(move)) return []
    return [this.deck.shuffle(), this.startPlayerTurn(RuleId.ChooseAction, this.nextCyclePlayer)]
  }

  /** The players take turns opening a round: the one who did not open the round that just ended opens the next. */
  get nextRoundPlayer(): number {
    const roundPlayer = this.remind<number>(Memory.RoundPlayer)
    return this.game.players.find((player) => player !== roundPlayer) ?? roundPlayer
  }

  /**
   * Who opens the first round of a new cycle: the player who is behind on Victory symbols, so that the one who is
   * winning the military conflicts does not also get to choose the zones first.
   */
  get nextCyclePlayer(): number {
    const players = this.game.players
    const fewest = Math.min(...players.map((player) => victorySymbols(this, player)))
    const behind = players.filter((player) => victorySymbols(this, player) === fewest)
    return behind.length === 1 ? behind[0] : this.nextRoundPlayer
  }

  get revealedTiles() {
    return this.material(MaterialType.ActionTile).location(LocationType.ActionTileRevealed)
  }

  get deck() {
    return this.material(MaterialType.ActionTile).location(LocationType.ActionTileDeck)
  }
}
