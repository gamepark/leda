import { getEnumValues, MaterialMove, MaterialRulesPart, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { Effect, EffectChoice, EffectQuantity, EffectSet, EffectSource, isEffectChoice } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Rules } from '../Rules'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { playerClan, specialActivationEffects } from './specialActivation'

type Move = MaterialMove<number, MaterialType, LocationType>

/** Resolving effects is always somebody's, hence the player. */
type Rule = PlayerTurnRule<number, MaterialType, LocationType>

/** Queueing what comes next is not: the military conflict queues the organisation behind a player's turn. */
type AnyRule = MaterialRulesPart<number, MaterialType, LocationType>

/**
 * The one place effects are resolved, whether a tile, a clan card or a Military Victory token gives them.
 *
 * An effect either gives something on its own, and its moves are returned here, or it asks the player something,
 * and then it is a rule of its own that has to be started. Those rules are queued rather than started on the spot:
 * one card may ask several things ("Spy. You may then play a card"), and each of them has to wait for the previous
 * one to be done. Whoever hands the game over to the first of them says what takes over once they are all resolved
 * (see {@link queueLast} and {@link EffectRule}).
 */

/** The rules waiting to be played, the first one being the next (see {@link Memory.NextRules}). */
export const pendingRules = (rules: Rules): RuleId[] => rules.game.memory[Memory.NextRules] ?? []

/** What an effect asks for is asked at once, before anything that was already waiting. */
const queueFirst = (rule: AnyRule, ruleIds: RuleId[]) => rule.memorize<RuleId[]>(Memory.NextRules, (pending: RuleId[] = []) => [...ruleIds, ...pending])

/** What takes over once everything the effects asked for has been answered. */
export const queueLast = (rule: AnyRule, ruleId: RuleId) => rule.memorize<RuleId[]>(Memory.NextRules, (pending: RuleId[] = []) => [...pending, ruleId])

/** Hands the game over to the next rule waiting, which stops waiting. */
export const startNextRule = (rule: AnyRule): Move[] => {
  const [next, ...rest] = pendingRules(rule)
  if (next === undefined) return []
  rule.memorize(Memory.NextRules, rest)
  return [rule.startRule(next)]
}

/** The choices waiting to be made, the first one being the one the player is being asked (see {@link Memory.EffectChoices}). */
export const pendingChoices = (rules: Rules): EffectChoice[] => rules.game.memory[Memory.EffectChoices] ?? []

/** The Food the card a player is being offered to play is discounted by (see {@link Effect.PlayCard}). */
export const cardDiscount = (rules: Rules): number => rules.game.memory[Memory.CardDiscount] ?? 0

/** The choice being made is over: the next one, if any, is the one to ask. */
export const forgetChoice = (rule: AnyRule) => rule.memorize(Memory.EffectChoices, pendingChoices(rule).slice(1))

/** What the rules an effect asks for are gathered into while the effects are read, one card being read as a whole. */
type Asked = { rules: RuleId[]; choices: EffectChoice[] }

/**
 * Everything an effect set gives: the moves for what it gives on its own, and the rules it needs queued for what
 * it has to ask. The source is where the set was reached from, which some effects are read against
 * (see {@link EffectSource}).
 */
export const resolveEffects = (rule: Rule, effects: EffectSet, source: EffectSource = {}): Move[] => {
  const asked: Asked = { rules: [], choices: [] }
  const moves = collect(rule, effects, source, asked)
  if (asked.rules.length > 0) queueFirst(rule, asked.rules)
  if (asked.choices.length > 0) rule.memorize(Memory.EffectChoices, [...asked.choices, ...pendingChoices(rule)])
  return moves
}

const collect = (rule: Rule, effects: EffectSet, source: EffectSource, asked: Asked): Move[] => {
  if (isEffectChoice(effects)) {
    asked.rules.push(RuleId.ChooseEffect)
    // The branches are read against the same source once one of them is picked, hence a choice carrying it.
    asked.choices.push({ ...effects, ...source })
    return []
  }
  return getEnumValues(Effect).flatMap((effect) => resolve(rule, effect, quantityOf(rule, effects[effect], source), asked, source))
}

/**
 * How many times an effect applies, which a card may read off the game rather than print (see {@link EffectQuantity}).
 * The app reads it the same way, to draw as many symbols as an effect is about to give.
 */
export const effectQuantity = (rules: Rules, player: number, quantity: EffectQuantity | undefined, cell?: XYCoordinates): number => {
  if (quantity === undefined) return 0
  return typeof quantity === 'number' ? quantity : quantity(rules, player, cell)
}

const quantityOf = (rule: Rule, quantity: EffectQuantity | undefined, source: EffectSource): number =>
  effectQuantity(rule, rule.player, quantity, source.cell)

/** One effect of a set, applied as many times as it is given. */
const resolve = (rule: Rule, effect: Effect, quantity: number, asked: Asked, source: EffectSource): Move[] => {
  if (quantity <= 0) return []
  const player = rule.player
  switch (effect) {
    case Effect.Food:
      return [rule.material(MaterialType.FoodToken).createItem({ location: { type: LocationType.PlayerFood, player }, quantity })]
    case Effect.Draw:
      return deck(rule, player).limit(quantity).moveItems({ type: LocationType.PlayerHand, player })
    case Effect.Military:
      // No item stands for a military symbol: they are only counted, until the conflict hands out the tokens.
      rule.memorize<number>(Memory.MilitarySymbols, (symbols) => symbols + quantity, player)
      return []
    case Effect.StealFood:
      // An opponent with no Food has nothing to take, and the effect is simply ignored.
      return food(rule, opponentOf(rule, player)).moveItems({ type: LocationType.PlayerFood, player }, quantity)
    case Effect.Awakening:
      // Only written down here, and resolved once the whole zone is activated (see {@link AwakeningRule}).
      rule.memorize<number>(Memory.Awakenings, (awakenings = 0) => awakenings + quantity, player)
      return []
    case Effect.SpecialActivation:
      return specialActivation(rule, quantity, asked, source)
    case Effect.PlayCard:
      // The quantity is what the card is discounted by, so a second such effect would overwrite the first: no card
      // gives two, and one that did would have to be read as one discount anyway.
      rule.memorize(Memory.CardDiscount, quantity)
      asked.rules.push(RuleId.PlayCard)
      return []
    default: {
      const ruleId = effectRules[effect]
      if (ruleId !== undefined) asked.rules.push(...times(quantity, ruleId))
      return []
    }
  }
}

/** The effects that are a rule of their own, which is to say the ones the player is asked to answer. */
const effectRules: Partial<Record<Effect, RuleId>> = {
  [Effect.Upgrade]: RuleId.UpgradeTile,
  [Effect.Flip]: RuleId.FlipDesert,
  [Effect.Spy]: RuleId.Spy,
  [Effect.ActivateCard]: RuleId.ActivateCard,
  [Effect.ActivateAndUpgradeTile]: RuleId.ActivateAndUpgradeTile,
  [Effect.MilitaryVictory]: RuleId.MilitaryVictory,
  [Effect.RedrawMilitaryVictory]: RuleId.RedrawMilitaryVictory,
  [Effect.TriggerMilitaryVictory]: RuleId.TriggerMilitaryVictory,
  [Effect.PlaceSharkToken]: RuleId.PlaceSharkToken
}

/**
 * The special activation of the clan of the player, worth what their Victory condition card says: the Cats draw,
 * the Sharks gain 2 military symbols, the Scorpions Spy, the Pandas pick between 1 Food and 1 Awakening.
 * The recursion stops of its own accord: what a special activation gives is anything but another one.
 */
const specialActivation = (rule: Rule, quantity: number, asked: Asked, source: EffectSource): Move[] => {
  const clan = playerClan(rule, rule.player)
  if (clan === undefined) return []
  return times(quantity, clan).flatMap(() => collect(rule, specialActivationEffects[clan], { ...source, from: Effect.SpecialActivation }, asked))
}

const times = <T>(quantity: number, value: T): T[] => Array.from({ length: quantity }, () => value)

const deck = (rule: Rule, player: number) => rule.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(player).deck()

const food = (rule: Rule, player: number) => rule.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(player)

const opponentOf = (rule: Rule, player: number): number => rule.game.players.find((other) => other !== player) ?? player
