import { ClanCardId } from '../ClanCardId'
import { ClanCardProperties } from './ClanCardProperties'

/**
 * The 11 cards of the Sharks, read off REGLES LEDA REQUINS.pdf.
 *
 * Each card has a normal effect and a Pack effect, the Pack one replacing the normal one while the card is
 * orthogonally adjacent to 2 Shark tokens. The cards whose normal effect is nothing are the cheap ones: they
 * are worth playing only where the Pack can reach them.
 */
export const sharkCards = {
  /** Upgrade one of your tiles. Pack: activate one of your tiles, then upgrade it if possible. */
  [ClanCardId.SharkUpgrade]: { cost: { food: 6 } },

  /** Spy. Pack: gain 1 Military and trigger the effect of one of your Military Victory tokens. */
  [ClanCardId.SharkSpyOrTriggerToken]: { cost: { food: 6 } },

  /** Nothing. Pack: put one of your Military Victory tokens back under the pile and draw a new one. */
  [ClanCardId.SharkPackRedrawToken]: { cost: { food: 3 } },

  /** Gain 1 Military. Pack: gain 2 Military. */
  [ClanCardId.SharkMilitary]: { cost: { food: 5 } },

  /** Gain 1 Military. Pack: gain 1 Military and draw 1 card. */
  [ClanCardId.SharkMilitaryAndDraw]: { cost: { food: 4 } },

  /** Gain 2 Military. Pack: gain 1 Military per orthogonally adjacent Shark token. */
  [ClanCardId.SharkMilitaryPerToken]: { cost: { food: 7 } },

  /** Nothing. Pack: draw 1 Military Victory token and resolve its effect. */
  [ClanCardId.SharkPackDrawToken]: { cost: { food: 7 } },

  /** Gain 1 Food. Pack: you may play a card from your hand, reducing its cost by 2 Food. */
  [ClanCardId.SharkFoodOrDiscount]: { cost: { food: 5 } },

  /** Gain 1 Food per pair of Military Victory tokens you own. Pack: gain 1 Food per token you own. */
  [ClanCardId.SharkFoodPerToken]: { cost: { food: 7 } },

  /** Nothing. Pack: place a Shark token on one of your tiles that has none. */
  [ClanCardId.SharkPackPlaceToken]: { cost: { food: 3 } },

  /** Nothing. Pack: Spy. */
  [ClanCardId.SharkPackSpy]: { cost: { food: 3 } }
} satisfies Partial<Record<ClanCardId, ClanCardProperties>>
