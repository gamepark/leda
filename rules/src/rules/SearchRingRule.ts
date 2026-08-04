import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { ClanCardId, ClanCardItemId } from '../material/ClanCardId'
import { ringsInDeck } from '../material/clanCards/catCards'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Cat card reads as "search a Ring in your deck, reveal it, add it to your hand and shuffle".
 *
 * The player names the Ring they want and not where it is: a deck is shuffled and hidden from its owner too, so
 * nobody at the table knows which card of the pile is which. What is in the pile is no secret though, being what
 * is left of the 13 cards of the clan once the hand and the cards in play are counted out, so the choice is a real
 * one and the app can offer it (see {@link ringsInDeck}).
 *
 * Finding that Ring in the pile is therefore the server's to do, and the move is declared unpredictable so that
 * the client waits for it rather than guessing an index (see {@link LedaRules.isUnpredictableMove}).
 *
 * Revealing is what taking it does: the move is public, so both players see which Ring left the deck. The Rings
 * are the win condition of the clan, so their opponent is entitled to know one is on its way.
 */
export class SearchRingRule extends EffectRule {
  /** A deck with no Ring left leaves nothing to search for, and the effect is lost. */
  onRuleStart(): Move[] {
    return this.rings.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return this.rings.map((ring) => this.customMove(CustomMoveType.SearchRing, ring))
  }

  /** Which Rings the deck still holds, worked out from everything else the player has. */
  get rings(): ClanCardId[] {
    return ringsInDeck(this, this.player)
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, ClanCardId>(CustomMoveType.SearchRing)(move)) return []
    const ring = move.data
    if (ring === undefined || !this.rings.includes(ring)) return []
    return this.deck.id<ClanCardItemId>((id) => id.front === ring).moveItems({ type: LocationType.PlayerHand, player: this.player })
  }

  get deck() {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(this.player)
  }

  /** The deck is shuffled once the Ring is out of it, so that nobody can tell what the search left behind. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.type !== LocationType.PlayerHand) return []
    return [this.deck.shuffle(), ...this.resume()]
  }
}
