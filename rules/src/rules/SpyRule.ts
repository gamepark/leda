import { isMoveItem, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { EffectRule } from './EffectRule'
import { spentDifferentPileSpy } from './effects'
import { eggBackMove, eggLookMoves, pileTop, putBackMoves, rememberSpy, spiablePiles, spiedEgg, spiedItem } from './spy'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * A Spy effect: the player looks in secret at the first item of a pile of their choice, their own deck, the pile
 * of Action tiles or the pile of Military Victory tokens, then puts it back on top of or under that pile.
 *
 * Taking the item out of its pile is what shows it: {@link LocationType.SpiedItem} hides it from everyone but the
 * player it belongs to, so the framework reveals it to them alone. Their opponent sees which pile is being looked
 * into, and nothing more, exactly as they would around a table.
 *
 * A 4th thing to look at while the Snakes are in play, which their sheet adds to the effect: one of the Eggs the
 * opponent has on their grid, which is the one way of reading a Snake before it hatches (see {@link spiableEggs}).
 * An Egg is taken nowhere: its owner already knows it and nobody else sits at the table, so it is turned over on
 * its own square for both players to read, then turned back (see {@link spiedSide}).
 */
export class SpyRule extends EffectRule {
  /**
   * No pile worth looking into and no Egg to read leaves nothing to do, and a rule with no move would hang the
   * game: both other piles empty while the Action tiles are down to their last one (see {@link spiablePiles}).
   */
  onRuleStart(): Move[] {
    return this.getPlayerMoves().length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    // An Egg is turned back where it lies: there is nothing to be asked about that one.
    const egg = eggBackMove(this)
    if (egg !== undefined) return [egg]
    const back = putBackMoves(this, this.player)
    return back === undefined ? this.lookMoves() : [back.onTop, back.under]
  }

  /**
   * The 3 piles, and the Eggs of the opponent. The Eggs are never barred by the constraint of a Scorpion Portal:
   * what that Portal binds is the piles its 2 Spies use, and a grid is not one of them.
   */
  lookMoves(): Move[] {
    const spied = { type: LocationType.SpiedItem, player: this.player }
    return [...spiablePiles(this, this.player).flatMap((pile) => pileTop(this, this.player, pile).moveItems(spied)), ...eggLookMoves(this, this.player)]
  }

  /**
   * The player makes 2 moves: taking an item, then putting it back. The second one is the end of the effect.
   * Which pile was looked into is read off the item going back rather than remembered: the type of that item is
   * the pile it belongs to (see {@link spiedPiles}).
   *
   * That is also the moment the Spy is worth writing down for the rest of the round: which end of the pile the
   * item went back into is the half of it nobody knew until now, and both halves are open to everyone
   * (see {@link Memory.Spies}). Under the pile is x 0, and on top of it is no x at all.
   *
   * An Egg has no end of a pile to write down: it was turned back on its own square, so what is written is which
   * card was read, and the card itself carries the mark of it (see {@link EggSpy}).
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    // Reading an item and putting it back are the 2 moves of this rule, and both of them move one.
    if (!isMoveItem(move) || spiedItem(this) !== undefined || spiedEgg(this).length > 0) return []
    if (move.location.type === LocationType.PlayedCard) {
      spentDifferentPileSpy(this)
      rememberSpy(this, { player: this.player, pile: MaterialType.ClanCard, egg: move.itemIndex })
      return this.resume()
    }
    spentDifferentPileSpy(this, move.itemType)
    rememberSpy(this, { player: this.player, pile: move.itemType, onTop: move.location.x !== 0 })
    return this.resume()
  }
}
