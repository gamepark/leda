import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Rules } from '../Rules'
import { RuleId } from './RuleId'

/**
 * Where the organisation of a grid stands. The app reads it to know what to offer on the table, and the rules of
 * the phase to know what is legal, so that the two can never disagree.
 */

/**
 * The player who is organising their grid, if any: the only one who may swap 2 of their squares, and the only
 * one whose grid has to let a tile be taken from under the cards played on it.
 */
export const organisingPlayer = (rules: Rules): number | undefined =>
  rules.game.rule?.id === RuleId.Organisation ? rules.game.rule.player : undefined

/** The Food a player owns, which is what they pay for the cards they play. */
export const playerFood = (rules: Rules, player: number): number =>
  rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(player).getQuantity()
