/**
 * What something gives when it is activated, whether it is a tile, a clan card or a Military Victory token.
 * The lexicon of the rulebook names each of them, and one engine resolves them all (see {@link resolveEffects}),
 * so that a card giving 1 Food and a tile giving 1 Food are one and the same thing to the rules.
 */
export enum Effect {
  /** Gain Food, the resource clan cards are paid with. */
  Food = 1,

  /** Draw: add the first card of your deck to your hand. */
  Draw,

  /** A military symbol, counted until the military conflict at the end of the round. */
  Military,

  /** Upgrade: flip one of your permanent tiles to its upgraded side. */
  Upgrade,

  /** The special activation of your clan, which its Victory condition card describes. */
  SpecialActivation,

  /** Spy: look at the first item of a pile, then put it back on top of it or under it. */
  Spy,

  /** Flip: turn one of your Deserts back onto its front, where it can be activated again. */
  Flip,

  /** Take 1 Food from your opponent. */
  StealFood,

  /** An Awakening, gathered by the Pandas and resolved once their zone is done (see {@link AwakeningRule}). */
  Awakening,

  /** Play a clan card from your hand, its Food cost reduced by the quantity of this effect. */
  PlayCard,

  /** Activate one of your clan cards in play, which gives what that card gives all over again. */
  ActivateCard,

  /** Draw the first Military Victory token and resolve it, exactly as winning a military conflict would. */
  MilitaryVictory
}

/** What something gives, and how many times each effect applies. */
export type Effects = Partial<Record<Effect, number>>

/**
 * An "OR": the player resolves one of these and only one.
 * Common enough to belong to the lexicon rather than to any one clan: the special activation of the Pandas is one,
 * and so are the cards that read "gain 1 Food OR gain 1 military symbol" (see {@link ChooseEffectRule}).
 *
 * `from` is the effect the choice was reached through, when it was reached through one: a special activation is
 * "1 crystal = 1 Food OR 1 Awakening", and what the crystal is worth is only readable beside the crystal itself.
 * Filled in as the choice is offered rather than written down with the branches, since the same branches may be
 * reached in more than one way.
 */
export type EffectChoice = { or: Effects[]; from?: Effect }

/** What anything in the game gives: a set of effects, or a choice between several such sets. */
export type EffectSet = Effects | EffectChoice

export const isEffectChoice = (effects: EffectSet): effects is EffectChoice => 'or' in effects

/** Whether there is anything at all to resolve, which is what makes a square worth activating. */
export const hasEffect = (effects: EffectSet): boolean => (isEffectChoice(effects) ? effects.or.length > 0 : Object.keys(effects).length > 0)
