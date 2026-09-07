import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { queueFirstRule } from './effects'
import { revealedCard, revealMoves } from './reveal'
import { RuleId } from './RuleId'
import { ringsInHand, underDeckMoves } from './underDeck'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * What a Cat card reads as "you may reveal a Ring from your hand and put it under your deck to draw and resolve 1
 * Military Victory token": a Ring is worth a token, and the trade is the player's to refuse, hence the pass.
 *
 * A Ring is one of the 3 the clan needs to win, so this is a real price rather than a formality: it goes back
 * under the deck, which is the far end of it, and the player will have to draw the whole deck to see it again.
 *
 * It is shown before it goes: the Ring leaves the hand for the reveal spot of its owner, where the app holds it in
 * sight for a second, and slides under their deck from there (see {@link revealMoves}). Revealing it is half of
 * what the card asks for, so it is a step of the trade and not a way of drawing it: a Ring going straight from a
 * hand nobody but its owner reads to a deck nobody reads at all would be spent without anyone seeing which.
 */
export class SpendRingForTokenRule extends EffectRule {
  /** A player with no Ring in hand has nothing to trade, and the effect is lost rather than refused. */
  onRuleStart(): Move[] {
    return this.rings.length > 0 ? [] : this.resume()
  }

  getPlayerMoves(): Move[] {
    return [...revealMoves(this.rings, this.player), this.customMove(CustomMoveType.Pass, this.player)]
  }

  /** The Rings the player holds. A hand is secret, so only its owner ever reads the fronts of these. */
  get rings() {
    return ringsInHand(this, this.player)
  }

  /**
   * The Ring shown goes under the deck it was traded from, and the token is then drawn and resolved by the rule
   * that does it everywhere else, queued ahead of what was waiting.
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.ClanCard)(move)) return []
    if (move.location.type === LocationType.RevealedCard) return underDeckMoves(revealedCard(this, this.player), this.player)
    if (move.location.type !== LocationType.PlayerDeck) return []
    queueFirstRule(this, RuleId.MilitaryVictory)
    return this.resume()
  }

  onCustomMove(move: CustomMove): Move[] {
    return isCustomMoveType(CustomMoveType.Pass)(move) ? this.resume() : []
  }
}
