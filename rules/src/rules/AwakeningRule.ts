import { isMoveItemType, ItemMove, MaterialMove, MoveItem, PlayerTurnRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { afterActivation } from './activation'
import { awakeningGroup, awakeningSteps, pandasInHand, pandasInPlay } from './awakening'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { awakenings } from './specialActivation'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * Still phase 1: the Awakenings a player gathered while activating their zone, resolved one at a time once the
 * whole zone is done. The rulebook is explicit about the order, and about why it matters: a Panda may be
 * activated on its square and only then be taken back into the hand of its owner.
 *
 * An Awakening puts a Panda from the hand onto the square of one of the level below, which goes back to the hand
 * in exchange. It takes a group to raise one: 2 Pandas of the lower level have to be on the grid, and only one of
 * them leaves it.
 *
 * Raising a Panda is all there is to do here: the choice between the Food and the Awakening was made when the
 * square was activated, and it was final (see {@link PandaSpecialActivationRule}).
 */
export class AwakeningRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  /**
   * Nothing to resolve leaves nothing to ask, and an Awakening that cannot be resolved is lost: a player is free
   * to gather one they turn out not to be able to play (see {@link PandaSpecialActivationRule}).
   * The whole count goes at once, since nothing moves on the grid between two of them: what stops one stops them
   * all.
   */
  onRuleStart(): Move[] {
    if (awakenings(this, this.player) > 0 && this.awakenMoves.length > 0) return []
    this.memorize(Memory.Awakenings, 0, this.player)
    return afterActivation(this)
  }

  getPlayerMoves(): Move[] {
    return this.awakenMoves
  }

  /**
   * Playing a Panda from the hand onto a square that holds one of the level below.
   * The move names the square rather than the card it replaces, which is what lets it be dragged there: which
   * card leaves is read from the square in {@link beforeItemMove}. Hence the squares deduplicated here, since
   * several Pandas of the same level may be piled on one of them.
   */
  get awakenMoves(): Move[] {
    const cards = this.material(MaterialType.ClanCard)
    return awakeningSteps.flatMap(({ from, to }) => {
      const asleep = pandasInPlay(this, this.player, from)
      if (asleep.length < awakeningGroup) return []
      const squares = [...new Set(asleep.getItems().map((item) => item.location.parent!))]
      return pandasInHand(this, this.player, to)
        .getIndexes()
        .flatMap((index) => squares.map((parent) => cards.index(index).moveItem({ type: LocationType.PlayedCard, player: this.player, parent })))
    })
  }

  /**
   * The other half of an Awakening: the card already on that square goes back to the hand of its owner, which is
   * read here, while the square still holds it. What is returned is played after the move all the same.
   * The card that leaves is the topmost one, the only one the player sees, the rest of the square being under it.
   */
  beforeItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!this.isAwakening(move)) return []
    const replaced = this.playedCards.parent(move.location.parent)
    if (!replaced.length) return []
    return [this.material(MaterialType.ClanCard).index(Math.max(...replaced.getIndexes())).moveItem({ type: LocationType.PlayerHand, player: this.player })]
  }

  /**
   * An Awakening is spent once it raised a Panda, and the last one is the end of phase 1 for that player.
   * Another one starts this rule over rather than staying in it: what is left to awaken can only be read once the
   * Panda that leaves the grid is back in hand, which is a consequence of this move and has not been played yet
   * (see {@link beforeItemMove}).
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!this.isAwakening(move)) return []
    this.memorize(Memory.Awakenings, awakenings(this, this.player) - 1, this.player)
    return awakenings(this, this.player) > 0 ? [this.startRule(RuleId.Awakening)] : afterActivation(this)
  }

  isAwakening(move: ItemMove<number, MaterialType, LocationType>): move is MoveItem<number, MaterialType, LocationType> {
    return isMoveItemType(MaterialType.ClanCard)(move) && move.location.type === LocationType.PlayedCard
  }

  get playedCards() {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(this.player)
  }
}
