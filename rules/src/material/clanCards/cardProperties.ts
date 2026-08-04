import { Rules } from '../../Rules'
import { ClanCardId } from '../ClanCardId'
import { EffectSet } from '../Effect'
import { catCards } from './catCards'
import { ClanCardProperties } from './ClanCardProperties'
import { pandaCards } from './pandaCards'
import { scorpionCards } from './scorpionCards'
import { sharkCards } from './sharkCards'

/**
 * Every clan card, gathered from the sheet of its clan (see {@link ClanCardProperties}).
 * The record is total rather than partial: a card added to {@link ClanCardId} without being described here does
 * not compile, which is what keeps the enum and the sheets from drifting apart.
 */
export const clanCardProperties: Record<ClanCardId, ClanCardProperties> = { ...pandaCards, ...sharkCards, ...catCards, ...scorpionCards }

/**
 * One of the 2 effects a card may print, and nothing at all for the cards whose effects are not implemented yet:
 * such a card leaves its square with nothing to activate, since it covers its tile.
 *
 * Which of the 2 is the live one belongs to the clan of the card and not to the card itself, so it is asked of
 * the table rather than of this: `second` is the answer, not the question (see {@link cardEffectsOn}).
 */
export const clanCardEffects = (card: ClanCardId, second = false): EffectSet =>
  (second ? clanCardProperties[card].secondEffects : clanCardProperties[card].effects) ?? {}

/**
 * What playing a card costs its owner in Food, and undefined when it is not paid in Food at all: the 4 Rings,
 * played for free once their condition is met, the 3 Cat cards paid with cards from the hand
 * (see {@link clanCardCardCost}), and the 5 Silver and Gold Pandas, which are not bought but awakened
 * (see {@link PandaLevel}).
 *
 * Read against the state the player is looking at: a Portal counts the cards in the hand its own card is still
 * part of (see {@link FoodCost}).
 */
export const clanCardFoodCost = (card: ClanCardId, rules: Rules, player: number): number | undefined => {
  const cost = clanCardProperties[card].cost
  if (cost === undefined || !('food' in cost)) return undefined
  return typeof cost.food === 'number' ? cost.food : cost.food(rules, player)
}

/**
 * What playing a card costs its owner in cards from their hand, which 3 of the Cat cards are paid with and no
 * other card of the game is, hence the undefined everywhere else.
 * Nothing is read off the state here: a price in cards is printed on the card, and the hand it is taken from is
 * not the hand the card was played out of (see {@link PayCardCostRule}).
 */
export const clanCardCardCost = (card: ClanCardId): number | undefined => {
  const cost = clanCardProperties[card].cost
  return cost !== undefined && 'cards' in cost ? cost.cards : undefined
}
