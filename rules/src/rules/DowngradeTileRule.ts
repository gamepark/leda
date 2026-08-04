import { isMoveItemType, ItemMove, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { TileId } from '../material/TileId'
import { EffectRule } from './EffectRule'
import { pendingRules } from './effects'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { downgradableTiles, worseFace } from './tileChoices'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The player turns one of their own tiles onto its worse face: a permanent tile loses its upgrade, a temporary one
 * becomes a Desert. Which of the 2 it is depends on the tile, and both are the face its owner would rather not be
 * showing (see {@link downgradableTiles}).
 *
 * Everything here is read against this.player, who owns those tiles and picks one of them, which is what the rule
 * is named after. What opens it is a Scorpion Portal, read as "your opponent flips one of their tiles": the card
 * belongs to the Scorpions, the choice belongs to their opponent, and that opponent is the player here.
 *
 * That makes it the one rule of the game a player opens for somebody else to answer. Everything else an effect
 * asks is asked of the player whose effect it is, and hands the game over without ever naming anyone
 * (see {@link EffectRule}), so this rule does the naming itself: it takes the turn to the opponent when it starts,
 * and gives it back to the owner of the effect when it is done.
 */
export class DowngradeTileRule extends EffectRule {
  /** Whose effect this is, and therefore who gets the game back once the choice is made. */
  get owner(): number {
    return this.remind<number>(Memory.EffectPlayer)
  }

  /**
   * Reached with the player whose effect it is, since that is who the rule before it belonged to: the turn goes
   * to their opponent, and this runs a second time with that opponent to play.
   * A player whose tiles are all on their worse face already has nothing to turn over, and the effect is lost.
   */
  onRuleStart(): Move[] {
    if (this.player === this.owner) return [this.startPlayerTurn(RuleId.DowngradeTile, this.nextPlayer)]
    return this.tiles.length > 0 ? [] : this.giveBack()
  }

  getPlayerMoves(): Move[] {
    return this.tiles.moveItems<TileId>((tile) => ({ ...tile.location, rotation: worseFace(tile.id!) }))
  }

  get tiles() {
    return downgradableTiles(this, this.player)
  }

  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    return this.giveBack()
  }

  /**
   * The rest of what the effects asked, handed back to the player they belong to.
   * {@link EffectRule.resume} would leave this player playing, since starting a rule keeps whoever is playing:
   * that is exactly right for every other effect rule, and exactly wrong for this one.
   */
  giveBack(): Move[] {
    const owner = this.owner
    const [next, ...rest] = pendingRules(this)
    this.memorize(Memory.EffectPlayer, undefined)
    if (next === undefined) return []
    this.memorize(Memory.NextRules, rest)
    return [this.startPlayerTurn(next, owner)]
  }
}
