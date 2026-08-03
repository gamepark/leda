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
 * What playing a card costs its owner in Food, and undefined when it cannot be bought with Food at all: the 4
 * Rings, played for free once their condition is met, the 3 Cat cards paid with cards from the hand, and the 5
 * Silver and Gold Pandas, which are not bought but awakened (see {@link PandaLevel}).
 * TODO: the 3 Cat cards, once there is somewhere to discard cards to.
 *
 * Read against the state the player is looking at: a Portal counts the cards in the hand its own card is still
 * part of (see {@link FoodCost}).
 */
/**
 * What a card gives when the square it was played on is activated, and nothing at all for the cards whose effects
 * are not implemented yet: such a card leaves its square with nothing to activate, since it covers its tile.
 */
export const clanCardEffects = (card: ClanCardId): EffectSet => clanCardProperties[card].effects ?? {}

export const clanCardFoodCost = (card: ClanCardId, rules: Rules, player: number): number | undefined => {
  const cost = clanCardProperties[card].cost
  if (cost === undefined || !('food' in cost)) return undefined
  return typeof cost.food === 'number' ? cost.food : cost.food(rules, player)
}
