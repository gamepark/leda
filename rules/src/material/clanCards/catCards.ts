import { Rules } from '../../Rules'
import { ClanCardId, ClanCardItemId } from '../ClanCardId'
import { Effect } from '../Effect'
import { LocationType } from '../LocationType'
import { MaterialType } from '../MaterialType'
import { ClanCardProperties } from './ClanCardProperties'

/**
 * The 13 cards of the Cats, read off REGLES LEDA CHATS.pdf.
 *
 * Each card that is not a Ring has 2 effects: activating it resolves the first one and rotates the card 180°,
 * so that the next activation resolves the second one and rotates it back. The 4 Rings have one effect between
 * them, "you may Rotate one of your Cat cards", and playing 3 of them wins the game.
 *
 * The 2 effects are printed on the card the way they are written here: the first one along the bottom edge, the
 * second one upside down in the opposite corner, where the half turn will bring it. A card whose second effect is
 * nothing at all is therefore a card worth activating every other round, and the Rotate of the Rings is what a
 * Cat player uses to stop paying that price.
 */

/** How many cards a player holds, which one of these cards gives Military and then Food for. */
const cardsInHand = (rules: Rules, player: number): number =>
  rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(player).length

/**
 * The 4 Rings share one effect, printed alone along their bottom edge. They have no second one, so nothing ever
 * turns a Ring over: what it offers is turning the other cards over.
 */
const ringEffects = { [Effect.RotateCatCard]: 1 }

export const catCards = {
  /** 1: copy the effect of a card your opponent can activate this turn. 2: draw 2 cards. */
  [ClanCardId.CatCopyOpponentCard]: {
    cost: { cards: 3 },
    effects: { [Effect.CopyOpponentCard]: 1 },
    secondEffects: { [Effect.Draw]: 2 }
  },

  /** 1: search a Ring in your deck, reveal it, add it to your hand and shuffle. 2: nothing. */
  [ClanCardId.CatSearchRing]: {
    cost: { food: 2 },
    effects: { [Effect.SearchRing]: 1 }
  },

  /** 1: upgrade 1 tile. 2: activate one of your tiles, upgraded or not. */
  [ClanCardId.CatUpgradeCardOrActivateTile]: {
    cost: { cards: 2 },
    effects: { [Effect.Upgrade]: 1 },
    secondEffects: { [Effect.ActivateTile]: 1 }
  },

  /** 1: gain 1 Military per card in your hand. 2: gain 1 Food per card in your hand. */
  [ClanCardId.CatMilitaryOrFoodPerCardInHand]: {
    cost: { food: 7 },
    effects: { [Effect.Military]: cardsInHand },
    secondEffects: { [Effect.Food]: cardsInHand }
  },

  /** 1: Spy, then draw 1 card. 2: nothing. */
  [ClanCardId.CatSpyAndDraw]: {
    cost: { food: 4 },
    effects: { [Effect.Spy]: 1, [Effect.Draw]: 1 }
  },

  /** 1: you may reveal a Ring from your hand and put it under your deck to draw and resolve 1 Military Victory token. 2: nothing. */
  [ClanCardId.CatSpendRingForToken]: {
    cost: { food: 5 },
    effects: { [Effect.SpendRingForToken]: 1 }
  },

  /** 1: gain 1 Food and 1 Military. 2: nothing. */
  [ClanCardId.CatFoodAndMilitary]: {
    cost: { cards: 1 },
    effects: { [Effect.Food]: 1, [Effect.Military]: 1 }
  },

  /** 1: draw 1 card and gain 1 Food. 2: nothing. */
  [ClanCardId.CatDrawAndFood]: {
    cost: { food: 5 },
    effects: { [Effect.Draw]: 1, [Effect.Food]: 1 }
  },

  /** 1: gain 2 Military. 2: upgrade 1 tile. */
  [ClanCardId.CatMilitaryOrUpgrade]: {
    cost: { food: 6 },
    effects: { [Effect.Military]: 2 },
    secondEffects: { [Effect.Upgrade]: 1 }
  },

  /** Red Ring. Condition: win a Military conflict by 3 symbols or more. */
  [ClanCardId.CatRingWinConflictByThree]: { effects: ringEffects },

  /** Blue Ring. Condition: empty your deck. */
  [ClanCardId.CatRingEmptyDeck]: { effects: ringEffects },

  /** Purple Ring. Condition: activate a zone holding at least 3 Cat cards. */
  [ClanCardId.CatRingThreeCatCards]: { effects: ringEffects },

  /** Orange Ring. Condition: have 5 upgraded tiles. */
  [ClanCardId.CatRingFiveUpgradedTiles]: { effects: ringEffects }
} satisfies Partial<Record<ClanCardId, ClanCardProperties>>

/** The 4 Rings, which are Cat cards like the others until 3 of them are in play. */
export const rings: ClanCardId[] = [
  ClanCardId.CatRingWinConflictByThree,
  ClanCardId.CatRingEmptyDeck,
  ClanCardId.CatRingThreeCatCards,
  ClanCardId.CatRingFiveUpgradedTiles
]

export const isRing = (card: ClanCardId): boolean => rings.includes(card)

/**
 * The Rings a player still has in their deck, worked out rather than looked up: a deck is shuffled and hidden from
 * its owner as much as from anyone, but what is in it is not a secret. The clan starts with its 13 cards, so a
 * Ring that is not in the hand, in play, or being looked at is a Ring still in the pile.
 *
 * That is what makes the search of {@link SearchRingRule} playable: the player names the Ring they want, and the
 * server alone has to know where in the pile it is.
 *
 * Only sound read from the seat of the player it is asked about: their own cards are all readable to them, where
 * their opponent sees the back of their hand and would count those Rings as still in the deck.
 */
export const ringsInDeck = (rules: Rules, player: number): ClanCardId[] => {
  const elsewhere = new Set(
    rules
      .material(MaterialType.ClanCard)
      .player(player)
      .location((location) => location.type !== LocationType.PlayerDeck)
      .getItems<ClanCardItemId>()
      .map((card) => card.id?.front)
  )
  return rings.filter((ring) => !elsewhere.has(ring))
}
