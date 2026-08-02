import { ClanCardId } from '../ClanCardId'
import { ClanCardProperties } from './ClanCardProperties'

/**
 * The 13 cards of the Cats, read off REGLES LEDA CHATS.pdf.
 *
 * Each card that is not a Ring has 2 effects: activating it resolves the first one and rotates the card 180°,
 * so that the next activation resolves the second one and rotates it back. The 4 Rings have one effect between
 * them, "you may Rotate one of your Cat cards", and playing 3 of them wins the game.
 */
export const catCards = {
  /** 1: copy the effect of a card your opponent can activate this turn. 2: draw 2 cards. */
  [ClanCardId.CatCopyOpponentCard]: { cost: { cards: 3 } },

  /** 1: search a Ring in your deck, reveal it, add it to your hand and shuffle. 2: nothing. */
  [ClanCardId.CatSearchRing]: { cost: { food: 2 } },

  /** 1: upgrade 1 card. 2: activate one of your tiles, upgraded or not. */
  [ClanCardId.CatUpgradeCardOrActivateTile]: { cost: { cards: 2 } },

  /** 1: gain 1 Military per card in your hand. 2: gain 1 Food per card in your hand. */
  [ClanCardId.CatMilitaryOrFoodPerCardInHand]: { cost: { food: 7 } },

  /** 1: Spy, then draw 1 card. 2: nothing. */
  [ClanCardId.CatSpyAndDraw]: { cost: { food: 4 } },

  /** 1: you may reveal a Ring from your hand and put it under your deck to draw and resolve 1 Military Victory token. 2: nothing. */
  [ClanCardId.CatSpendRingForToken]: { cost: { food: 5 } },

  /** 1: gain 1 Food and 1 Military. 2: nothing. */
  [ClanCardId.CatFoodAndMilitary]: { cost: { cards: 1 } },

  /** 1: draw 1 card and gain 1 Food. 2: nothing. */
  [ClanCardId.CatDrawAndFood]: { cost: { food: 5 } },

  /** 1: gain 2 Military. 2: upgrade 1 tile. */
  [ClanCardId.CatMilitaryOrUpgrade]: { cost: { food: 6 } },

  /** Red Ring. Condition: win a Military conflict by 3 symbols or more. */
  [ClanCardId.CatRingWinConflictByThree]: {},

  /** Blue Ring. Condition: empty your deck. */
  [ClanCardId.CatRingEmptyDeck]: {},

  /** Purple Ring. Condition: activate a zone holding at least 3 Cat cards. */
  [ClanCardId.CatRingThreeCatCards]: {},

  /** Orange Ring. Condition: have 5 upgraded tiles. */
  [ClanCardId.CatRingFiveUpgradedTiles]: {}
} satisfies Partial<Record<ClanCardId, ClanCardProperties>>
