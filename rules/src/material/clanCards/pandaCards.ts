import { ClanCardId } from '../ClanCardId'
import { ClanCardProperties } from './ClanCardProperties'
import { PandaLevel } from './PandaLevel'

/**
 * The 11 cards of the Pandas, read off REGLES LEDA_PANDA.pdf.
 *
 * A versatile clan, whose cards often let their owner pick between 2 effects. What they are built around is the
 * level of their Pandas: only a Bronze one is bought and played during the organisation, and the Silver and Gold
 * ones below reach the grid through an Awakening, which swaps a Panda on the grid for one of the next level.
 * Having both Gold ones in play, the King and the Queen, wins the game.
 *
 * The first card is the odd one out: it costs Food like a Bronze Panda, but no level is printed in its corner,
 * so no Awakening can ever replace it.
 */
export const pandaCards = {
  /** Draw 1 card and trigger your Special activation. */
  [ClanCardId.PandaDrawAndSpecialActivation]: { cost: { food: 5 } },

  /** Upgrade one of your tiles. */
  [ClanCardId.PandaUpgrade]: { cost: { food: 5 }, pandaLevel: PandaLevel.Bronze },

  /** Gain 1 Food OR gain 1 Military. */
  [ClanCardId.PandaFoodOrMilitary]: { cost: { food: 5 }, pandaLevel: PandaLevel.Bronze },

  /** Gain 1 Food. You may play a Panda card from your hand, reducing its Food cost by 1. */
  [ClanCardId.PandaFoodAndDiscount]: { cost: { food: 5 }, pandaLevel: PandaLevel.Bronze },

  /** Draw 1 card OR gain 1 Military. */
  [ClanCardId.PandaDrawOrMilitary]: { cost: { food: 5 }, pandaLevel: PandaLevel.Bronze },

  /** Gain 1 Food. Spy. */
  [ClanCardId.PandaFoodAndSpy]: { cost: { food: 5 }, pandaLevel: PandaLevel.Bronze },

  /** Gain 2 Military. */
  [ClanCardId.PandaMilitary]: { pandaLevel: PandaLevel.Silver },

  /** Gain 1 Military. Upgrade one of your tiles. */
  [ClanCardId.PandaMilitaryAndUpgrade]: { pandaLevel: PandaLevel.Silver },

  /** Spy. You may play a Panda card from your hand, reducing its Food cost by 2. */
  [ClanCardId.PandaSpyAndDiscount]: { pandaLevel: PandaLevel.Silver },

  /** Gain 2 Military and draw 1 Military Victory token, resolving its effect. */
  [ClanCardId.PandaKing]: { pandaLevel: PandaLevel.Gold },

  /** Activate one of your Panda cards in play. */
  [ClanCardId.PandaQueen]: { pandaLevel: PandaLevel.Gold }
} satisfies Partial<Record<ClanCardId, ClanCardProperties>>
