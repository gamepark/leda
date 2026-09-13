import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { gridTiles } from '../material/PlayerGrid'
import { EffectRule } from './EffectRule'
import { playedEggs } from './snake'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Snake card reads as "move one of your Eggs": its owner takes one of the Eggs they have in play and lays
 * it on another square of their own grid, where it covers whatever stood there, exactly as playing it there would
 * have (see {@link LocationType.PlayedCard}).
 *
 * Which Egg is moved stays a secret: the card is hidden on both sides of the move, so their opponent sees an Egg
 * change squares and learns nothing more than they already knew (see {@link snake}).
 *
 * Any of the 15 other squares of the grid, and never the one the Egg is already on: the rulebook has the Egg
 * moved, and a move that changes nothing is not one.
 */
export class MoveEggRule extends EffectRule {
  /** A player whose Eggs have all hatched, or lie under another card, has none to move. */
  onRuleStart(): Move[] {
    return this.eggs.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    const player = this.player
    const cards = this.material(MaterialType.ClanCard)
    const tiles = gridTiles(this.material(MaterialType.Tile), player).getIndexes()
    return this.eggs.getIndexes().flatMap((index) => {
      const from = cards.getItem(index).location.parent
      return tiles.filter((parent) => parent !== from).map((parent) => cards.index(index).moveItem({ type: LocationType.PlayedCard, player, parent }))
    })
  }

  get eggs() {
    return playedEggs(this, this.player)
  }

  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    return isMoveItemType(MaterialType.ClanCard)(move) ? this.resume() : []
  }
}
