import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { sharkSupply, tilesWithoutSharkToken } from './sharkPack'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Shark card reads as "place a Shark token on one of your tiles that has none": a token straight out of the
 * supply, on a square the Pack has not reached yet, which is how the Sharks spread it without playing more cards.
 *
 * The token lands wherever the board puts it, on the right slot of the card it lands on, or on the left one when
 * that square is already surrounded, and it may wake the Pack of its neighbours up. None of which is a move
 * (see {@link sharkSlotOn}).
 */
export class PlaceSharkTokenRule extends EffectRule {
  /** Nothing to place, or nowhere left to place it, and the effect is lost. */
  onRuleStart(): Move[] {
    return this.getPlayerMoves().length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    const supply = sharkSupply(this, this.player)
    if (supply.getQuantity() === 0) return []
    return tilesWithoutSharkToken(this, this.player)
      .getIndexes()
      .flatMap((tile) => supply.moveItems({ type: LocationType.PlacedSharkToken, player: this.player, parent: tile }, 1))
  }

  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.SharkToken)(move)) return []
    return move.location.type === LocationType.PlacedSharkToken ? this.resume() : []
  }
}
