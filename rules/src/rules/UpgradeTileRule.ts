import { isMoveItemType, ItemMove, MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { upgradableTiles } from './activation'
import { RuleId } from './RuleId'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The Upgrade effect of a tile the player just activated: they turn one of their permanent tiles over, onto the
 * stronger face it will show on every later activation.
 *
 * The player does not change, so this rule and {@link ActivateZoneRule} hand each other back and forth with
 * startRule rather than startPlayerTurn: what is left of the zone to activate is untouched while this lasts.
 */
export class UpgradeTileRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  /** An Upgrade is lost if there is nothing left to upgrade: every permanent tile already shows its best face. */
  onRuleStart(): Move[] {
    return this.upgradableTiles.length > 0 ? [] : [this.startRule(RuleId.ActivateZone)]
  }

  getPlayerMoves() {
    return this.upgradableTiles.moveItems((tile) => ({ ...tile.location, rotation: true }))
  }

  get upgradableTiles() {
    return upgradableTiles(this, this.player)
  }

  /** Upgrading is the whole of this rule: the player goes back to the zone as soon as a tile is turned over. */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    return [this.startRule(RuleId.ActivateZone)]
  }
}
