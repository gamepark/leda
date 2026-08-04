import { XYCoordinates } from '@gamepark/rules-api'
import { Rules } from '../Rules'

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

  /** Activate one of your tiles, then upgrade that same tile if it can be. */
  ActivateAndUpgradeTile,

  /** Draw the first Military Victory token and resolve it, exactly as winning a military conflict would. */
  MilitaryVictory,

  /** Put one of the Military Victory tokens you own back under the pile, then draw a new one and resolve it. */
  RedrawMilitaryVictory,

  /** Resolve the effect of one of the Military Victory tokens you own, all over again. */
  TriggerMilitaryVictory,

  /** Place one of your Shark tokens on one of your tiles that has none (see {@link sharkPack}). */
  PlaceSharkToken,

  /** Activate the effect reminded on one of your Deserts. The Desert stays one: nothing is turned over. */
  ActivateDesert,

  /** Upgrade one of your tiles, then activate that same tile, on the face it shows once upgraded. */
  UpgradeAndActivateTile,

  /**
   * Spy, on a pile none of the Spies of the same effect has been used on. The quantity is how many Spies are bound
   * to each other, which is what tells them apart from Spies gathered from anywhere else (see {@link SpyRule}).
   */
  SpyDifferentPiles,

  /** Your opponent turns one of their tiles onto its Desert or non upgraded face, whichever that tile has. */
  FlipOpponentTile,

  /** Swap 2 squares of your grid, with whatever is played on them. */
  SwapSquares,

  /** No player may win a Military Victory token for the rest of the round. */
  BlockMilitaryVictory
}

/**
 * How many times an effect applies.
 *
 * A number for most, and a formula for what a card reads off the game: "1 Food per pair of Military Victory tokens
 * you own" is 1 Food, applied as many times as the player has pairs. Written the way the Food cost of a Portal is
 * (see {@link FoodCost}), and read against the 3 things a card ever looks at: the game, its owner, and the square
 * it was played on.
 */
export type EffectQuantity = number | ((rules: Rules, player: number, cell?: XYCoordinates) => number)

/** What something gives, and how many times each effect applies. */
export type Effects = Partial<Record<Effect, EffectQuantity>>

/**
 * Where a set of effects was reached from, which some of them are read against.
 *
 * `from` is the effect it was reached through, when it was reached through one: a special activation is "1 crystal
 * = 1 Food OR 1 Awakening", and what the crystal is worth is only readable beside the crystal itself.
 * `cell` is the square that gives them, when a square is what gives them: a Shark card counts the tokens around
 * its own square.
 */
export type EffectSource = {
  from?: Effect
  cell?: XYCoordinates
}

/**
 * An "OR": the player resolves one of these and only one.
 * Common enough to belong to the lexicon rather than to any one clan: the special activation of the Pandas is one,
 * and so are the cards that read "gain 1 Food OR gain 1 military symbol" (see {@link ChooseEffectRule}).
 * It carries where it was reached from, so that the branches are read against the same thing once picked.
 */
export type EffectChoice = { or: Effects[] } & EffectSource

/** What anything in the game gives: a set of effects, or a choice between several such sets. */
export type EffectSet = Effects | EffectChoice

export const isEffectChoice = (effects: EffectSet): effects is EffectChoice => 'or' in effects

/** Whether there is anything at all to resolve, which is what makes a square worth activating. */
export const hasEffect = (effects: EffectSet): boolean => (isEffectChoice(effects) ? effects.or.length > 0 : Object.keys(effects).length > 0)
