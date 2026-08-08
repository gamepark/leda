import { MaterialMove, MaterialRulesPart, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { Effect, EffectChoice, effectEntries, EffectQuantity, EffectSet, EffectSource, isEffectChoice } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf } from '../material/PlayerGrid'
import { Rules } from '../Rules'
import { Memory } from './Memory'
import { rotateCard } from './playedCards'
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

/**
 * One more rule to ask before anything already waiting, for a rule that turns out to need another one: a Cat card
 * trading a Ring for a Military Victory token hands the token over to the rule that draws it everywhere else.
 */
export const queueFirstRule = (rule: AnyRule, ruleId: RuleId) => queueFirst(rule, [ruleId])

/** Hands the game over to the next rule waiting, which stops waiting. */
export const startNextRule = (rule: AnyRule): Move[] => {
  const [next, ...rest] = pendingRules(rule)
  if (next === undefined) return []
  rule.memorize(Memory.NextRules, rest)
  return [rule.startRule(next)]
}

/** The choices waiting to be made, the first one being the one the player is being asked (see {@link Memory.EffectChoices}). */
export const pendingChoices = (rules: Rules): EffectChoice[] => rules.game.memory[Memory.EffectChoices] ?? []

/**
 * What is left of a set of effects once one of them has asked the player something, which waits for the answer
 * (see {@link PendingEffectsRule}).
 *
 * The quantities are the numbers they had come to when the set was read, and not the formulas some of them are
 * written as (see {@link EffectQuantity}): what is waiting has to survive in the memory of the game, where a
 * function cannot go. The order is the one the card prints, which the record keeps for the same reason it keeps
 * it anywhere else (see {@link effectEntries}).
 */
export type PendingEffects = { effects: Partial<Record<Effect, number>>; source: EffectSource }

/** The sets waiting to be resolved, the first one being the next (see {@link Memory.PendingEffects}). */
export const pendingEffects = (rules: Rules): PendingEffects[] => rules.game.memory[Memory.PendingEffects] ?? []

/** The set being resolved is off the list, the way a choice being made is. */
export const forgetPendingEffects = (rule: AnyRule) => rule.memorize(Memory.PendingEffects, pendingEffects(rule).slice(1))

/** The Food the card a player is being offered to play is discounted by (see {@link Effect.PlayCard}). */
export const cardDiscount = (rules: Rules): number => rules.game.memory[Memory.CardDiscount] ?? 0

/** The choice being made is over: the next one, if any, is the one to ask. */
export const forgetChoice = (rule: AnyRule) => rule.memorize(Memory.EffectChoices, pendingChoices(rule).slice(1))

/** What the rules an effect asks for are gathered into while the effects are read, one card being read as a whole. */
type Asked = { rules: RuleId[]; choices: EffectChoice[]; pending: PendingEffects[] }

/**
 * Everything an effect set gives: the moves for what it gives on its own, and the rules it needs queued for what
 * it has to ask. The source is where the set was reached from, which some effects are read against
 * (see {@link EffectSource}).
 */
export const resolveEffects = (rule: Rule, effects: EffectSet, source: EffectSource = {}): Move[] => {
  const asked: Asked = { rules: [], choices: [], pending: [] }
  const moves = collect(rule, effects, source, asked)
  if (asked.rules.length > 0) queueFirst(rule, asked.rules)
  if (asked.choices.length > 0) rule.memorize(Memory.EffectChoices, [...asked.choices, ...pendingChoices(rule)])
  // What is left over goes in front of what was already waiting, exactly as the rules that will resolve it do:
  // each of those takes the first set of the list, so the two lists are only ever read in step with each other.
  if (asked.pending.length > 0) rule.memorize(Memory.PendingEffects, [...asked.pending, ...pendingEffects(rule)])
  return moves
}

/**
 * The effects of a set, resolved left to right, in the order they were written down: a card is read the way it is
 * printed, and that order is the whole of what tells "Spy, then draw 1 card" from a card drawn before its owner
 * has looked at the top of their deck (see {@link effectEntries}).
 *
 * An effect either gives something on the spot, and its moves are returned here, or it asks the player something,
 * and opens a rule of its own. Everything written after a question waits for the answer instead of being given
 * ahead of it: it is written down as it stands and handed to a rule queued behind the question, which gives it
 * once it has been answered (see {@link PendingEffectsRule}). What is waiting is read the same way from there, so
 * a card that asks twice waits twice, and each part of it lands where the card puts it.
 */
const collect = (rule: Rule, effects: EffectSet, source: EffectSource, asked: Asked): Move[] => {
  if (isEffectChoice(effects)) {
    asked.rules.push(RuleId.ChooseEffect)
    // The branches are read against the same source once one of them is picked, hence a choice carrying it.
    asked.choices.push({ ...effects, ...source })
    return []
  }
  const moves: Move[] = []
  const entries = effectEntries(effects)
  for (let read = 0; read < entries.length; read++) {
    // Something has been asked, whether by an effect written above this one or by the set this one is being read
    // through: what is left of the card is for once the player has answered.
    if (asked.rules.length > 0) {
      queuePending(rule, asked, entries.slice(read), source)
      return moves
    }
    const [effect, written] = entries[read]
    const quantity = quantityOf(rule, written, source)
    if (quantity > 0) moves.push(...resolve(rule, effect, quantity, asked, source))
  }
  return moves
}

/**
 * What is left of a set, written down as it stands and queued behind the question it is waiting on
 * (see {@link PendingEffects}). Nothing is queued when there is nothing left to give: a card whose last effect is
 * the one that asked, or one whose remainder comes to nothing on this game.
 */
const queuePending = (rule: Rule, asked: Asked, entries: [Effect, EffectQuantity][], source: EffectSource) => {
  const left = entries.map(([effect, written]): [Effect, number] => [effect, quantityOf(rule, written, source)]).filter(([, quantity]) => quantity > 0)
  if (left.length === 0) return
  asked.rules.push(RuleId.PendingEffects)
  asked.pending.push({ effects: Object.fromEntries(left) as Partial<Record<Effect, number>>, source })
}

/**
 * How many times an effect applies, which a card may read off the game rather than print (see {@link EffectQuantity}).
 * The app reads it the same way, to draw as many symbols as an effect is about to give.
 */
export const effectQuantity = (rules: Rules, player: number, quantity: EffectQuantity | undefined, source: EffectSource = {}): number => {
  if (quantity === undefined) return 0
  return typeof quantity === 'number' ? quantity : quantity(rules, player, sourceCell(rules, source))
}

const quantityOf = (rule: Rule, quantity: EffectQuantity | undefined, source: EffectSource): number =>
  effectQuantity(rule, rule.player, quantity, source)

/**
 * The square the thing that gives a set of effects stands on, as it stands right now: what a card reading its own
 * surroundings is read against (see {@link EffectQuantity}). A tile is on its square, and a card is on the square
 * of the tile it was played over, being parented to that tile and following it wherever it goes.
 * Undefined when nothing on the grid gives them, which is what a Military Victory token is, and undefined too for
 * a card that has left the grid.
 */
export const sourceCell = (rules: Rules, source: EffectSource): XYCoordinates | undefined => {
  if (source.item === undefined) return undefined
  const item = rules.material(source.item.type).getItem(source.item.index)
  if (item === undefined) return undefined
  if (source.item.type === MaterialType.Tile) return cellOf(item.location)
  // A card is parented to the tile of its square, so its square is wherever that tile stands.
  const tile = item.location.parent === undefined ? undefined : rules.material(MaterialType.Tile).getItem(item.location.parent)
  return tile === undefined ? undefined : cellOf(tile.location)
}

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
    case Effect.SpyDifferentPiles:
      // What is queued is the ordinary Spy: only the constraint below tells these ones apart (see {@link SpyRule}).
      rule.memorize<SpyDifferentPiles>(Memory.SpyDifferentPiles, { left: quantity, piles: [] })
      asked.rules.push(...times(quantity, RuleId.Spy))
      return []
    case Effect.FlipOpponentTile:
      // Named for the card on this side and for the player answering on the other (see {@link RuleId.DowngradeTile}).
      // The one rule somebody else answers: whose effect it is has to survive until they have.
      rule.memorize(Memory.EffectPlayer, player)
      asked.rules.push(...times(quantity, RuleId.DowngradeTile))
      return []
    case Effect.HalfTurn:
      // The card taking it is the one that gave it, and that card itself rather than whatever stands on the square
      // it stood on when it gave it (see {@link EffectSource}).
      // Given once however many times it is given: a card has 2 faces, and turning it twice is turning nothing.
      return source.item === undefined ? [] : rotateCard(rule, source.item)
    case Effect.BlockMilitaryVictory:
      // Nothing to ask and nothing to move: the round simply stops handing tokens out (see {@link canWinMilitaryVictory}).
      rule.memorize(Memory.MilitaryVictoryBlocked, true)
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
  [Effect.PlaceSharkToken]: RuleId.PlaceSharkToken,
  [Effect.ActivateDesert]: RuleId.ActivateDesert,
  [Effect.UpgradeAndActivateTile]: RuleId.UpgradeAndActivateTile,
  [Effect.SwapSquares]: RuleId.SwapSquares,
  [Effect.ActivateTile]: RuleId.ActivateTile,
  [Effect.CopyOpponentCard]: RuleId.CopyOpponentCard,
  [Effect.SearchRing]: RuleId.SearchRing,
  [Effect.SpendRingForToken]: RuleId.SpendRingForToken,
  [Effect.RotateCatCard]: RuleId.RotateCatCard
}

/** The Spies of one effect that have to land on different piles, and the piles they have used so far. */
export type SpyDifferentPiles = { left: number; piles: MaterialType[] }

/** The constraint the Spies of a Scorpion Portal are under, undefined when the Spy being resolved is free. */
export const spyDifferentPiles = (rules: Rules): SpyDifferentPiles | undefined => {
  const constraint: SpyDifferentPiles | undefined = rules.game.memory[Memory.SpyDifferentPiles]
  return constraint !== undefined && constraint.left > 0 ? constraint : undefined
}

/**
 * One of those Spies is done: the pile it used is taken, and the constraint is forgotten once the last of them
 * has been resolved, so that it never reaches a Spy the same activation gathers from somewhere else.
 */
export const spentDifferentPileSpy = (rule: AnyRule, pile: MaterialType) => {
  const constraint = spyDifferentPiles(rule)
  if (constraint === undefined) return
  const left = constraint.left - 1
  rule.memorize(Memory.SpyDifferentPiles, left > 0 ? { left, piles: [...constraint.piles, pile] } : undefined)
}

/** Whether a Military Victory token may still be won this round (see {@link Effect.BlockMilitaryVictory}). */
export const canWinMilitaryVictory = (rules: Rules): boolean => rules.game.memory[Memory.MilitaryVictoryBlocked] !== true

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
