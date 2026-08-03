import type { MoveItem } from '@gamepark/rules-api'
import type { Clan } from '../Clan'
import type { LocationType } from './LocationType'
import type { MaterialType } from './MaterialType'

/**
 * The clan cards a player draws and then plays onto their grid: 13 for the Cats, 11 for each other clan.
 * The Victory condition card of a clan is not one of them, it is a material type of its own.
 *
 * Ids are numbered `100 * clan + n`, so `Math.floor(id / 100)` gives the Clan a card belongs to. Within a clan,
 * the order is the order of the punchboard.
 *
 * The cards have no printed name, only icons, so the values are named after what they do. What each of them
 * costs and does is described in {@link clanCardProperties}, card by card, and not here: this enum is only the
 * identity of a card, which is all the app needs to draw it.
 */
export enum ClanCardId {
  // Pandas. See {@link pandaCards}.
  PandaDrawAndSpecialActivation = 101,
  PandaUpgrade,
  PandaFoodOrMilitary,
  PandaFoodAndDiscount,
  PandaDrawOrMilitary,
  PandaFoodAndSpy,
  PandaMilitary,
  PandaMilitaryAndUpgrade,
  PandaSpyAndDiscount,

  /** The King and the Queen, which the Pandas win the game by having both in play. */
  PandaKing,
  PandaQueen,

  // Sharks. See {@link sharkCards}.
  SharkUpgrade = 201,
  SharkSpyOrTriggerToken,
  SharkPackRedrawToken,
  SharkMilitary,
  SharkMilitaryAndDraw,
  SharkMilitaryPerToken,
  SharkPackDrawToken,
  SharkFoodOrDiscount,
  SharkFoodPerToken,
  SharkPackPlaceToken,
  SharkPackSpy,

  // Cats. See {@link catCards}.
  CatCopyOpponentCard = 301,
  CatSearchRing,
  CatUpgradeCardOrActivateTile,
  CatMilitaryOrFoodPerCardInHand,
  CatSpyAndDraw,
  CatSpendRingForToken,
  CatFoodAndMilitary,
  CatDrawAndFood,
  CatMilitaryOrUpgrade,

  /** The 4 Rings, apart in the numbering because they are the win condition of the Cats rather than cards to buy. */
  CatRingWinConflictByThree = 310,
  CatRingEmptyDeck,
  CatRingThreeCatCards,
  CatRingFiveUpgradedTiles,

  // Scorpions. See {@link scorpionCards}.
  ScorpionFoodPerDesertPair = 401,
  ScorpionMilitaryPerDesertPair,
  ScorpionDrawAndFood,
  ScorpionDiscountPerDesertPair,
  ScorpionActivateDesert,
  ScorpionUpgradeAndActivate,
  ScorpionFoodAndPortalBonus,

  /** The 4 Portals, apart in the numbering because they are the win condition of the Scorpions. */
  ScorpionPortalDoubleSpy = 408,
  ScorpionPortalFlipOpponentTile,
  ScorpionPortalSwap,
  ScorpionPortalBlockMilitaryVictory
}

/** The clan a card belongs to, which its own value encodes: ids are numbered `100 * clan + n`. */
export const clanOf = (card: ClanCardId): Clan => Math.floor(card / 100)

/**
 * A clan card is identified by both of its faces. The clan is redundant with the front, which already encodes it,
 * but it has to be a field of its own: hiding a card removes its front, and what is left has to be enough to draw
 * its back, which is the emblem of its clan.
 */
export type ClanCardItemId = {
  front: ClanCardId
  back: Clan
}

/**
 * The card a move is about to play, when it is one the player reading the move was not allowed to see.
 *
 * A hand is secret, so on the client of its owner's opponent a card is nothing but the back of its clan, and what
 * it turns out to be travels with the move that plays it. A hook that runs before the move is applied has to read
 * it from there: the id of the item itself has not been filled in yet.
 * Undefined when the move reveals nothing, which is the ordinary case of a card its reader could already see.
 */
export const revealedFront = (move: MoveItem<number, MaterialType, LocationType>): ClanCardId | undefined =>
  (move.reveal?.id as ClanCardItemId | undefined)?.front
