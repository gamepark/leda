import type { Clan } from '../Clan'

/**
 * The clan cards a player draws and then plays onto their grid: 13 for the Cats, 11 for each other clan.
 * The Victory condition card of a clan is not one of them, it is a material type of its own.
 *
 * Ids are numbered `100 * clan + n`, so `Math.floor(id / 100)` gives the Clan a card belongs to, and the Pandas
 * can be added later without renumbering anything. Within a clan, the order is the order of the punchboard.
 *
 * The cards have no printed name, only icons, so the values are named after what they do. What each of them
 * costs and does is described in {@link clanCardProperties}, card by card, and not here: this enum is only the
 * identity of a card, which is all the app needs to draw it.
 */
export enum ClanCardId {
  // Cats. See {@link catCards}.
  CatCopyOpponentCard = 101,
  CatSearchRing,
  CatUpgradeCardOrActivateTile,
  CatMilitaryOrFoodPerCardInHand,
  CatSpyAndDraw,
  CatSpendRingForToken,
  CatFoodAndMilitary,
  CatDrawAndFood,
  CatMilitaryOrUpgrade,

  /** The 4 Rings, apart in the numbering because they are the win condition of the Cats rather than cards to buy. */
  CatRingWinConflictByThree = 110,
  CatRingEmptyDeck,
  CatRingThreeCatCards,
  CatRingFiveUpgradedTiles,

  // Pandas: 201 to 211. Their card images are missing from the assets, so their ids are not defined yet.

  // Sharks. See {@link sharkCards}.
  SharkUpgrade = 301,
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

/**
 * A clan card is identified by both of its faces. The clan is redundant with the front, which already encodes it,
 * but it has to be a field of its own: hiding a card removes its front, and what is left has to be enough to draw
 * its back, which is the emblem of its clan.
 */
export type ClanCardItemId = {
  front: ClanCardId
  back: Clan
}
