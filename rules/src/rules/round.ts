import { MaterialRules } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from './Memory'

/** Who is playing which round, which the app reads to lay the revealed Action tiles out. */

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

/** The active player of the round: the one who revealed the Action tile, picked the zone, and acts first. */
export const roundPlayer = (rules: Rules): number | undefined => rules.game.memory[Memory.RoundPlayer]

/** How far along the row of revealed Action tiles the last one is, the tiles being numbered from 0. */
const lastRevealedIndex = (rules: Rules): number =>
  rules
    .material(MaterialType.ActionTile)
    .location(LocationType.ActionTileRevealed)
    .getItems()
    .reduce((last, tile) => Math.max(last, tile.location.x ?? 0), 0)

/**
 * The active player of the round an Action tile was revealed on, the tiles being numbered from 0 in the order
 * they were revealed. The players take turns being the active one, so the last revealed tile belongs to the
 * active player of the current round, the one before it to their opponent, and so on backwards.
 */
export const actionTileRoundPlayer = (rules: Rules, index: number): number | undefined => {
  const player = roundPlayer(rules)
  if (player === undefined) return undefined
  if ((lastRevealedIndex(rules) - index) % 2 === 0) return player
  return rules.game.players.find((other) => other !== player)
}
