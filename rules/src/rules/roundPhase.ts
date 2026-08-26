import { Rules } from '../Rules'
import { isMilitaryConflictPhase } from './militaryConflict'
import { isOrganisationPhase } from './organisation'
import { RuleId } from './RuleId'

/**
 * The 3 phases a round goes through, numbered the way the player aid card of the box numbers them: the app draws
 * the line of that card the round is on, and opens the whole of it beside a reminder of the 3
 * (see {@link RoundPhaseButton}).
 */
export enum RoundPhase {
  Activation = 1,
  MilitaryConflict,
  Organisation
}

/**
 * Which phase the round is in, whatever rule the game happens to be on: the rules an effect opens along the way
 * belong to the phase that will take the game back, so a Spy is read as part of the activation it interrupted and
 * not as a moment of its own (see {@link isActivationPhase}, {@link isMilitaryConflictPhase} and
 * {@link isOrganisationPhase}).
 *
 * The activation is what is left rather than a test of its own: it is the phase a round opens on, and the one
 * every rule that is neither of the other 2 belongs to, the choice of the zone and the special activations of the
 * clans included (see {@link RuleId.ChooseAction}, {@link RuleId.Awakening} and {@link RuleId.PlaceRing}).
 * Undefined while the players are still picking their clans: the first round has not started yet.
 */
export const roundPhase = (rules: Rules): RoundPhase | undefined => {
  const rule = rules.game.rule?.id
  if (rule === undefined || rule === RuleId.ChooseClan || rule === RuleId.Mulligan) return undefined
  if (isMilitaryConflictPhase(rules)) return RoundPhase.MilitaryConflict
  if (isOrganisationPhase(rules)) return RoundPhase.Organisation
  return RoundPhase.Activation
}
