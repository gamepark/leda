import { Effect, effectEntries, EffectSet, isEffectChoice } from '../material/Effect'
import { LedaRules } from '../LedaRules'
import { Rules } from '../Rules'
import { effectQuantity, effectRules } from './effects'
import { EffectRule } from './EffectRule'

/**
 * Whether a set of effects gives anything to that player, were they to resolve it: what a Cat card asks of a square
 * of its opponent before offering to copy it (see {@link copiableCells}). A copy that gives nothing is a choice that
 * wastes the effect, and one that copies a copy is a choice that never ends.
 *
 * Read against the player copying, who is the one resolving the copy: a quantity counting Snakes is counted on
 * their side, and is 0 for a clan that has none. An "OR" gives something if any of its branches does.
 */
export const givesAnything = (rules: Rules, player: number, effects: EffectSet): boolean =>
  isEffectChoice(effects)
    ? effects.or.some((branch) => givesAnything(rules, player, branch))
    : effectEntries(effects).some(([effect, quantity]) => effectQuantity(rules, player, quantity) > 0 && effectGivesAnything(rules, player, effect))

/**
 * One effect, given at least once. The ones a rule answers are asked of that rule, which knows when it is lost
 * (see {@link EffectRule.isPossible}): a clan added later is covered by writing its rules, and nothing here.
 * The others give on the spot, and always give something.
 *
 * 2 effects never give anything copied:
 * - The copy itself, which only a mirror match can offer: it would read the same squares again, and a player left
 *   with that square alone would copy it forever.
 * - The half turn of a Cat card, which turns the card that gave it, and a copy is given by no card: the card that
 *   copies takes its own half turn, and the Rotation is never done twice (see {@link CopyOpponentCardRule}).
 */
const effectGivesAnything = (rules: Rules, player: number, effect: Effect): boolean => {
  if (effect === Effect.CopyOpponentCard || effect === Effect.HalfTurn) return false
  const ruleId = effectRules[effect]
  if (ruleId === undefined) return true
  const rule = new LedaRules({ ...rules.game, rule: { id: ruleId, player } }).rulesStep
  return !(rule instanceof EffectRule) || rule.isPossible()
}
