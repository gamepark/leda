import { Rules } from '../../Rules'

/**
 * Everything one clan card is: what it costs today, what it does once effects are implemented.
 * The cards are described clan by clan ({@link catCards}, {@link sharkCards}, {@link scorpionCards}), which is
 * how the game itself is written: one sheet of rules per clan.
 *
 * Gathered per card rather than split into one record per property, because a clan card is not a uniform row of
 * data: a Cat card has 2 effects it alternates between, a Shark card has an effect and a Pack effect, a Ring has
 * a condition instead of a cost, and a Portal has a cost that is read off the game. One record per property
 * would need an exception each, and nothing would keep the exceptions aligned.
 */
export type ClanCardProperties = {
  /**
   * What playing the card costs its owner. Absent for the 4 Cat Rings only, which are never bought: each has a
   * condition of its own, and is played for free as soon as it is met.
   * TODO: the conditions of the 4 Rings, and the effects of every card.
   */
  cost?: ClanCardCost
}

/** Cards are paid in Food, except for the 3 Cat cards that are paid with cards from their owner's hand. */
export type ClanCardCost = { food: FoodCost } | { cards: number }

/**
 * A Food cost is a number, except for the 4 Scorpion Portals, which cost "9 minus" something the game holds.
 * Such a cost is read off the state the player is looking at, before their card has left their hand: one of the
 * Portals counts the cards in that hand, and would cost 1 more if it were read once the card was gone.
 */
export type FoodCost = number | ((rules: Rules, player: number) => number)
