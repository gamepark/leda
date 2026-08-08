import { XYCoordinates } from '@gamepark/rules-api'
import { Rules } from '../Rules'
import { MaterialType } from './MaterialType'

/**
 * What something gives when it is activated, whether it is a tile, a clan card or a Military Victory token.
 * The lexicon of the rulebook names each of them, and one engine resolves them all (see {@link resolveEffects}),
 * so that a card giving 1 Food and a tile giving 1 Food are one and the same thing to the rules.
 *
 * Named rather than numbered, unlike every other enum here: what a card gives is written down as a record of its
 * effects, and a record keeps the order its keys were written in only for as long as those keys are not numbers.
 * A card is resolved left to right, the way it is printed and the way it is read at the table, so that order is
 * the whole of what tells "Spy, then draw 1 card" from drawing the card the player is about to look at
 * (see {@link effectEntries}).
 */
export enum Effect {
  /** Gain Food, the resource clan cards are paid with. */
  Food = 'food',

  /** Draw: add the first card of your deck to your hand. */
  Draw = 'draw',

  /** A military symbol, counted until the military conflict at the end of the round. */
  Military = 'military',

  /** Upgrade: flip one of your permanent tiles to its upgraded side. */
  Upgrade = 'upgrade',

  /** The special activation of your clan, which its Victory condition card describes. */
  SpecialActivation = 'specialActivation',

  /** Spy: look at the first item of a pile, then put it back on top of it or under it. */
  Spy = 'spy',

  /** Flip: turn one of your Deserts back onto its front, where it can be activated again. */
  Flip = 'flip',

  /** Take 1 Food from your opponent. */
  StealFood = 'stealFood',

  /** An Awakening, gathered by the Pandas and resolved once their zone is done (see {@link AwakeningRule}). */
  Awakening = 'awakening',

  /** Play a clan card from your hand, its Food cost reduced by the quantity of this effect. */
  PlayCard = 'playCard',

  /** Activate one of your clan cards in play, which gives what that card gives all over again. */
  ActivateCard = 'activateCard',

  /** Activate one of your tiles, then upgrade that same tile if it can be. */
  ActivateAndUpgradeTile = 'activateAndUpgradeTile',

  /** Draw the first Military Victory token and resolve it, exactly as winning a military conflict would. */
  MilitaryVictory = 'militaryVictory',

  /** Put one of the Military Victory tokens you own back under the pile, then draw a new one and resolve it. */
  RedrawMilitaryVictory = 'redrawMilitaryVictory',

  /** Resolve the effect of one of the Military Victory tokens you own, all over again. */
  TriggerMilitaryVictory = 'triggerMilitaryVictory',

  /** Place one of your Shark tokens on one of your tiles that has none (see {@link sharkPack}). */
  PlaceSharkToken = 'placeSharkToken',

  /** Activate the effect reminded on one of your Deserts. The Desert stays one: nothing is turned over. */
  ActivateDesert = 'activateDesert',

  /** Upgrade one of your tiles, then activate that same tile, on the face it shows once upgraded. */
  UpgradeAndActivateTile = 'upgradeAndActivateTile',

  /**
   * Spy, on a pile none of the Spies of the same effect has been used on. The quantity is how many Spies are bound
   * to each other, which is what tells them apart from Spies gathered from anywhere else (see {@link SpyRule}).
   */
  SpyDifferentPiles = 'spyDifferentPiles',

  /** Your opponent turns one of their tiles onto its Desert or non upgraded face, whichever that tile has. */
  FlipOpponentTile = 'flipOpponentTile',

  /** Swap 2 squares of your grid, with whatever is played on them. */
  SwapSquares = 'swapSquares',

  /** No player may win a Military Victory token for the rest of the round. */
  BlockMilitaryVictory = 'blockMilitaryVictory',

  /** Activate one of your tiles, on the face it is showing, whether that face is upgraded or not. */
  ActivateTile = 'activateTile',

  /** Copy what one of the squares of your opponent in the zone of the round gives, without activating theirs. */
  CopyOpponentCard = 'copyOpponentCard',

  /** Search your deck for a Ring, reveal it, take it into your hand, then shuffle your deck. */
  SearchRing = 'searchRing',

  /** You may put a Ring from your hand back under your deck to draw a Military Victory token and resolve it. */
  SpendRingForToken = 'spendRingForToken',

  /** You may turn one of your Cat cards in play half a turn, onto the other of the 2 effects it prints. */
  RotateCatCard = 'rotateCatCard',

  /**
   * The card giving it takes half a turn, onto the other of the 2 effects it prints: what every Cat card but the
   * Rings gives on top of what it prints, and the whole of what a blank face gives.
   * An effect rather than something the activation does to Cat cards, so that a face printing nothing else is a
   * face worth activating still: turning the card back onto its other effect is what activating it is for.
   */
  HalfTurn = 'halfTurn'
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

/** What something gives, and how many times each effect applies, written in the order the card prints them. */
export type Effects = Partial<Record<Effect, EffectQuantity>>

/**
 * The effects of a set, in the order they were written down, which is the order the card prints them and the
 * order they are resolved in (see {@link resolveEffects}) and drawn in (see {@link EffectIcons}).
 *
 * A record is what keeps that order here, which is why the effects are named and not numbered: a record hands its
 * keys back the way they were written, unless they look like numbers, in which case the runtime sorts them and
 * "Spy, then draw 1 card" becomes a card drawn before it was looked at.
 */
export const effectEntries = <T>(effects: Partial<Record<Effect, T>>): [Effect, T][] => Object.entries(effects) as [Effect, T][]

/**
 * Where a set of effects was reached from, which some of them are read against.
 *
 * `from` is the effect it was reached through, when it was reached through one: a special activation is "1 crystal
 * = 1 Food OR 1 Awakening", and what the crystal is worth is only readable beside the crystal itself.
 * `item` is what gives them, when something on the table gives them: the tile of a square, or the card played over
 * that tile. A Shark card counts the tokens around itself, and a Cat card turns itself over.
 *
 * The thing itself and not the square it stands on, because a square is only where something is for now: a
 * Scorpion Portal swaps 2 squares in the middle of an activation, and what a card gives afterwards is still that
 * card's, wherever the swap has left it (see {@link sourceCell}).
 *
 * Always something of the player resolving them, and never of their opponent: what is copied off the other side
 * of the table is resolved here, on the card that copied it (see {@link CopyOpponentCardRule}).
 */
export type EffectSource = {
  from?: Effect
  item?: EffectItem
}

/** A tile of a grid or a card played on it, named the way a move names an item: its material, and where it is. */
export type EffectItem = { type: MaterialType; index: number }

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

/** Whether what is being read turns itself over once it has given the rest (see {@link Effect.HalfTurn}). */
export const hasHalfTurn = (effects?: EffectSet): boolean => effects !== undefined && !isEffectChoice(effects) && effects[Effect.HalfTurn] !== undefined
