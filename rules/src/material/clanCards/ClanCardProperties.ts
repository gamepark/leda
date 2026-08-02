import { Rules } from '../../Rules'
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
   * the 4 Cat Rings, played for free as soon as their own condition is met, and the Silver and Gold Pandas,
   * which reach the grid through an Awakening during the activation rather than by being paid for.
   * TODO: the conditions of the 4 Rings, and the effects of every card.
   */
  cost?: ClanCardCost

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
