import { isMoveItem, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { spentDifferentPileSpy, spyDifferentPiles } from './effects'
import { pileTop, putBackMoves, rememberSpy, SpiedPile, spiablePiles, spiedItem } from './spy'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * A Spy effect: the player looks in secret at the first item of a pile of their choice, their own deck, the pile
 * of Action tiles or the pile of Military Victory tokens, then puts it back on top of or under that pile.
 *
 * Taking the item out of its pile is what shows it: {@link LocationType.SpiedItem} hides it from everyone but the
 * player it belongs to, so the framework reveals it to them alone. Their opponent sees which pile is being looked
 * into, and nothing more, exactly as they would around a table.
 */
export class SpyRule extends EffectRule {
  /**
   * No pile worth looking into leaves nothing to do, and a rule with no move would hang the game: both other
   * piles empty while the Action tiles are down to their last one (see {@link spiablePiles}).
   */
  onRuleStart(): Move[] {
    return this.getPlayerMoves().length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    const back = putBackMoves(this, this.player)
    return back === undefined ? this.lookMoves() : [back.onTop, back.under]
  }

  /**
   * The piles left to look into. All of them, unless a Scorpion Portal bound this Spy to the ones its own other
   * Spies have not used yet (see {@link Effect.SpyDifferentPiles}).
   */
  get piles(): readonly SpiedPile[] {
    const taken = spyDifferentPiles(this)?.piles ?? []
    return spiablePiles(this, this.player).filter((pile) => !taken.includes(pile.type))
  }

  lookMoves(): Move[] {
    return this.piles.flatMap((pile) => pileTop(this, this.player, pile).moveItems({ type: LocationType.SpiedItem, player: this.player }))
  }

  /**
   * The player makes 2 moves: taking an item, then putting it back. The second one is the end of the effect.
   * Which pile was looked into is read off the item going back rather than remembered: the type of that item is
   * the pile it belongs to (see {@link spiedPiles}).
   *
   * That is also the moment the Spy is worth writing down for the rest of the round: which end of the pile the
   * item went back into is the half of it nobody knew until now, and both halves are open to everyone
   * (see {@link Memory.Spies}). Under the pile is x 0, and on top of it is no x at all.
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    // Taking an item and putting it back are the 2 moves of this rule, and both of them move one.
    if (!isMoveItem(move) || spiedItem(this) !== undefined) return []
    spentDifferentPileSpy(this, move.itemType)
    rememberSpy(this, { player: this.player, pile: move.itemType, onTop: move.location.x !== 0 })
    return this.resume()
  }
}
