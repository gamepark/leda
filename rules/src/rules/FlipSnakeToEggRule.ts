import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { hatchedSnakes } from './snake'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What 2 of the Snake cards read as "then turn one of your Snakes back onto its Egg side": the price the 2
 * strongest cards of the clan are paid with, taking their owner one Snake further from the 7 they win on and
 * putting a card back where it costs 2 Food to open again (see {@link snake}).
 *
 * The card asking is one of the Snakes it may be answered with: it is in play and on its Snake side, having just
 * been activated, and the rulebook sets none of them aside. Turning it back is therefore always possible, which
 * is what makes this a price and not a bonus.
 *
 * A Snake turned back is an Egg again: its front goes back to being its owner's alone, and its Hatching effect
 * will be resolved once more the next time it is hatched.
 */
export class FlipSnakeToEggRule extends EffectRule {
  /** A player whose Snakes have all been buried under other cards has none left to turn back. */
  onRuleStart(): Move[] {
    return this.snakes.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.snakes.moveItems((snake) => ({ ...snake.location, rotation: false }))
  }

  get snakes() {
    return hatchedSnakes(this, this.player)
  }

  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    return isMoveItemType(MaterialType.ClanCard)(move) ? this.resume() : []
  }
}
