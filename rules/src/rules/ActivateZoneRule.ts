import { CustomMove, getEnumValues, isCustomMoveType, MaterialMove, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { tileAt } from '../material/PlayerGrid'
import { isPermanent, TileEffect, TileEffects, tileEffects } from '../material/TileEffect'
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
   * A zone can hold nothing to activate at all, 4 Deserts for instance, in which case the player is skipped on
   * the spot: a rule that offers no move would leave the game waiting for a player with nothing to play.
   * This also runs when an effect that opened a rule of its own hands the player back, hence nothing reset here:
   * what they already activated is remembered per player, and emptied when the round starts.
   */
  onRuleStart(): Move[] {
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
    this.memorize<XYCoordinates[]>(Memory.ActivatedCells, (cells) => [...cells, cell], this.player)
    const effects = this.effectsOn(cell)
    const moves = this.activate(cell, effects)
    // An Upgrade is a choice, so the square hands over to the rule that offers it, and the sequence stops there:
    // that rule hands the player back to this one, whose onRuleStart reads what is left to activate.
    if (effects[TileEffect.Upgrade]) {
      this.memorize(Memory.NextRule, RuleId.ActivateZone)
      return [...moves, this.startRule(RuleId.UpgradeTile)]
    }
    return [...moves, ...this.nextStep()]
  }

  /** What the tile on a square gives, on the face it currently shows. */
  effectsOn(cell: XYCoordinates): TileEffects {
    const item = this.tileOn(cell).getItem<TileId>()
    return item === undefined ? {} : tileEffects(item.id, item.location.rotation === true)
  }

  /**
   * Everything a square gives, in the order the effects are numbered, which is the order the rulebook reads them
   * in. A temporary tile is turned into a Desert once its effect has been resolved.
   */
  activate(cell: XYCoordinates, effects: TileEffects): Move[] {
    const tile = this.tileOn(cell)
    const item = tile.getItem<TileId>()
    if (item === undefined) return []
    const moves = getEnumValues(TileEffect).flatMap((effect) => this.resolve(effect, effects[effect] ?? 0))
    if (item.location.rotation !== true && !isPermanent(item.id)) moves.push(tile.moveItem({ ...item.location, rotation: true }))
    return moves
  }

  /** The tile on a square of the grid of the player who is activating. */
  tileOn(cell: XYCoordinates) {
    return tileAt(this.material(MaterialType.Tile), this.player, cell)
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
      case TileEffect.Upgrade:
        // Turning a tile over is a choice, so it is a rule of its own, which onCustomMove hands over to.
        return []
      default:
        // TODO: the special activation depends on the clan the player took. It is resolved on the spot, as the
        // square it comes from is activated, and not once every other square has been.
        return []
    }
  }

  /** Always drawn from the lowest x, which is the top of the pile the DeckLocator draws. */
  get deck() {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(this.player).sort((card) => card.location.x!)
  }

  /**
   * Nothing happens until the player has activated everything they could. Then their opponent activates the same
   * zone of their own grid, and once both are done comes the military conflict.
   */
  nextStep(): Move[] {
    if (this.activableCells.length > 0) return []
    if (this.player === this.remind<number>(Memory.RoundPlayer)) return [this.startPlayerTurn(RuleId.ActivateZone, this.nextPlayer)]
    return [this.startRule(RuleId.MilitaryConflict)]
  }
}
