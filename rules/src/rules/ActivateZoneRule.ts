import { CustomMove, getEnumValues, isCustomMoveType, MaterialMove, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { tileAt } from '../material/PlayerGrid'
import { isPermanent, TileEffect, tileEffects } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { activableCells } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * Phase 1 of a round, once the zone is known: the player activates each square of that zone in their own grid,
 * if possible and in the order of their choice. The active player of the round goes first, then their opponent
 * starts the same rule over on their own grid.
 */
export class ActivateZoneRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  /**
   * Each player activates the zone on their own, so what the previous one resolved is forgotten here.
   * A zone can hold nothing to activate at all, 4 Deserts for instance, in which case the player is skipped
   * on the spot: a rule that offers no move would leave the game waiting for a player with nothing to play.
   */
  onRuleStart(): Move[] {
    this.memorize<XYCoordinates[]>(Memory.ActivatedCells, [])
    return this.nextStep()
  }

  getPlayerMoves() {
    return this.activableCells.map((cell) => this.customMove(CustomMoveType.ActivateSquare, cell))
  }

  get activableCells(): XYCoordinates[] {
    return activableCells(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move)) return []
    const cell = move.data
    if (cell === undefined) return []
    // Remembered before the effects are built, so that what is left to activate is read against this square done.
    this.memorize<XYCoordinates[]>(Memory.ActivatedCells, (cells) => [...cells, cell])
    return [...this.activate(cell), ...this.nextStep()]
  }

  /**
   * Everything a square gives, in the order the effects are numbered, which is the order the rulebook reads them
   * in. A temporary tile is turned into a Desert once its effect has been resolved.
   */
  activate(cell: XYCoordinates): Move[] {
    const tile = tileAt(this.material(MaterialType.Tile), this.player, cell)
    const item = tile.getItem<TileId>()
    if (item === undefined) return []
    const flipped = item.location.rotation === true
    const effects = tileEffects(item.id, flipped)
    const moves = getEnumValues(TileEffect).flatMap((effect) => this.resolve(effect, effects[effect] ?? 0))
    if (!flipped && !isPermanent(item.id)) moves.push(tile.moveItem({ ...item.location, rotation: true }))
    return moves
  }

  /** One effect of a tile, applied as many times as the tile gives it. */
  resolve(effect: TileEffect, quantity: number): Move[] {
    if (quantity === 0) return []
    switch (effect) {
      case TileEffect.Food:
        return [this.material(MaterialType.FoodToken).createItem({ location: { type: LocationType.PlayerFood, player: this.player }, quantity })]
      case TileEffect.Draw:
        return this.deck.limit(quantity).moveItems({ type: LocationType.PlayerHand, player: this.player })
      case TileEffect.Military:
        // No item stands for a military symbol: they are only counted, until the conflict hands out the tokens.
        this.memorize<number>(Memory.MilitarySymbols, (symbols) => symbols + quantity, this.player)
        return []
      default:
        // TODO: Upgrade flips a permanent tile of the player's choice, and the special activation depends on the
        // clan they play. Both are resolved on the spot, as the square they come from is activated.
        return []
    }
  }

  /** Always drawn from the lowest x, which is the top of the pile the DeckLocator draws. */
  get deck() {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(this.player).sort((card) => card.location.x!)
  }

  /**
   * Nothing happens until the player has activated everything they could. Then their opponent activates the same
   * zone of their own grid, and once both are done the round is over.
   */
  nextStep(): Move[] {
    if (this.activableCells.length > 0) return []
    if (this.player === this.remind<number>(Memory.RoundPlayer)) return [this.startPlayerTurn(RuleId.ActivateZone, this.nextPlayer)]
    // TODO: phase 2 is the military conflict and phase 3 the organisation. Until they exist the round ends here.
    // The player who was not the active one becomes it, which is this player: they activated second.
    return [this.startPlayerTurn(RuleId.ChooseAction, this.player)]
  }
}
