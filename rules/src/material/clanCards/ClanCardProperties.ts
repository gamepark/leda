import { Rules } from '../../Rules'
import { EffectSet } from '../Effect'
import { PandaLevel } from './PandaLevel'

/**
 * Everything one clan card is: what it costs today, what it does once effects are implemented.
 * The cards are described clan by clan ({@link pandaCards}, {@link sharkCards}, {@link catCards},
 * {@link scorpionCards}), which is how the game itself is written: one sheet of rules per clan.
 *
 * Gathered per card rather than split into one record per property, because a clan card is not a uniform row of
 * data: a Cat card has 2 effects it alternates between, a Shark card has an effect and a Pack effect, a Ring has
 * a condition instead of a cost, a Portal has a cost that is read off the game, and a Panda has a level. One
 * record per property would need an exception each, and nothing would keep the exceptions aligned.
 */
export type ClanCardProperties = {
  /**
   * What playing the card costs its owner during the organisation. Absent for the cards that are never bought:
   * the 4 Cat Rings, put in play for free once their own condition is met (see {@link ringPlacements}), and the
   * Silver and Gold Pandas, which reach the grid through an Awakening during the activation rather than by being
   * paid for.
   */
  cost?: ClanCardCost

  /**
   * What the card gives when the square it was played on is activated, in the lexicon every effect of the game
   * shares (see {@link Effect}). A card covers the tile of its square: what it gives is given instead of what the
   * tile gave, which is why a card showing a face with none at all leaves its square with nothing to activate.
   * Absent for the 4 cheap Shark cards, which print nothing outside of their Pack.
   */
  effects?: EffectSet

  /**
   * The second effect the card prints, for the clans whose cards do not always give the same thing: a Shark card
   * shows its normal effect and its Pack effect, a Cat card its effect 1 and its effect 2.
   * Which of the 2 is the live one is never written on the card, it is read off the table, and how depends on the
   * clan: the Sharks cover one of them with a token, the Cats turn the card over (see {@link cardEffectsOn}).
   */
  secondEffects?: EffectSet

  /** Only the Pandas have one, and one of them has none at all (see {@link PandaLevel}). */
  pandaLevel?: PandaLevel
}

/**
 * Cards are paid in Food, except for the 3 Cat cards that are paid with cards from their owner's hand.
 */
export type ClanCardCost = { food: FoodCost } | { cards: number }

/**
 * A Food cost is a number, except for the 4 Scorpion Portals, which cost "9 minus" something the game holds.
 * Such a cost is read off the state the player is looking at, before their card has left their hand: one of the
 * Portals counts the cards in that hand, and would cost 1 more if it were read once the card was gone.
 */
export type FoodCost = number | ((rules: Rules, player: number) => number)
