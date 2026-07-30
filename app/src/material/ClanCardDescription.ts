import { Clan, getClanCardClan } from '@gamepark/leda/Clan'
import { ClanCardId } from '@gamepark/leda/material/ClanCardId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { CardDescription } from '@gamepark/react-game'
import { tileSize } from './TileDescription'
import { getEnumValues, MaterialItem } from '@gamepark/rules-api'
import CatBack from '../images/cards/cat/back.jpg'
import SharkBack from '../images/cards/shark/back.jpg'
import ScorpionBack from '../images/cards/scorpion/back.jpg'
import CatCopyOpponentCard from '../images/cards/cat/cat-copy-opponent-card.jpg'
import CatSearchRing from '../images/cards/cat/cat-search-ring.jpg'
import CatUpgradeCardOrActivateTile from '../images/cards/cat/cat-upgrade-card-or-activate-tile.jpg'
import CatMilitaryOrFoodPerCardInHand from '../images/cards/cat/cat-military-or-food-per-card-in-hand.jpg'
import CatSpyAndDraw from '../images/cards/cat/cat-spy-and-draw.jpg'
import CatSpendRingForToken from '../images/cards/cat/cat-spend-ring-for-token.jpg'
import CatFoodAndMilitary from '../images/cards/cat/cat-food-and-military.jpg'
import CatDrawAndFood from '../images/cards/cat/cat-draw-and-food.jpg'
import CatMilitaryOrUpgrade from '../images/cards/cat/cat-military-or-upgrade.jpg'
import CatRingWinConflictByThree from '../images/cards/cat/cat-ring-win-conflict-by-three.jpg'
import CatRingEmptyDeck from '../images/cards/cat/cat-ring-empty-deck.jpg'
import CatRingThreeCatCards from '../images/cards/cat/cat-ring-three-cat-cards.jpg'
import CatRingFiveUpgradedTiles from '../images/cards/cat/cat-ring-five-upgraded-tiles.jpg'
import SharkUpgrade from '../images/cards/shark/shark-upgrade.jpg'
import SharkSpyOrTriggerToken from '../images/cards/shark/shark-spy-or-trigger-token.jpg'
import SharkPackRedrawToken from '../images/cards/shark/shark-pack-redraw-token.jpg'
import SharkMilitary from '../images/cards/shark/shark-military.jpg'
import SharkMilitaryAndDraw from '../images/cards/shark/shark-military-and-draw.jpg'
import SharkMilitaryPerToken from '../images/cards/shark/shark-military-per-token.jpg'
import SharkPackDrawToken from '../images/cards/shark/shark-pack-draw-token.jpg'
import SharkFoodOrDiscount from '../images/cards/shark/shark-food-or-discount.jpg'
import SharkFoodPerToken from '../images/cards/shark/shark-food-per-token.jpg'
import SharkPackPlaceToken from '../images/cards/shark/shark-pack-place-token.jpg'
import SharkPackSpy from '../images/cards/shark/shark-pack-spy.jpg'
import ScorpionFoodPerDesertPair from '../images/cards/scorpion/scorpion-food-per-desert-pair.jpg'
import ScorpionMilitaryPerDesertPair from '../images/cards/scorpion/scorpion-military-per-desert-pair.jpg'
import ScorpionDrawAndFood from '../images/cards/scorpion/scorpion-draw-and-food.jpg'
import ScorpionDiscountPerDesertPair from '../images/cards/scorpion/scorpion-discount-per-desert-pair.jpg'
import ScorpionActivateDesert from '../images/cards/scorpion/scorpion-activate-desert.jpg'
import ScorpionUpgradeAndActivate from '../images/cards/scorpion/scorpion-upgrade-and-activate.jpg'
import ScorpionFoodAndPortalBonus from '../images/cards/scorpion/scorpion-food-and-portal-bonus.jpg'
import ScorpionPortalDoubleSpy from '../images/cards/scorpion/scorpion-portal-double-spy.jpg'
import ScorpionPortalFlipOpponentTile from '../images/cards/scorpion/scorpion-portal-flip-opponent-tile.jpg'
import ScorpionPortalSwap from '../images/cards/scorpion/scorpion-portal-swap.jpg'
import ScorpionPortalBlockMilitaryVictory from '../images/cards/scorpion/scorpion-portal-block-military-victory.jpg'

/**
 * All the cards of a clan share one back, the emblem of that clan, including their Victory condition card.
 * The Pandas are missing: their cards are absent from the assets, and playableClans keeps them out of the choice.
 */
export const clanBacks: Partial<Record<Clan, string>> = {
  [Clan.Cat]: CatBack,
  [Clan.Shark]: SharkBack,
  [Clan.Scorpion]: ScorpionBack
}

/**
 * The clan cards a player draws and plays onto their grid. They are square, like the tiles they are played on.
 * Generated from the ClanCardId enum: an image file is named after the value it belongs to.
 */
export class ClanCardDescription extends CardDescription<number, MaterialType, LocationType, ClanCardId> {
  width = tileSize
  height = tileSize
  borderRadius = 0.5

  images = {
    [ClanCardId.CatCopyOpponentCard]: CatCopyOpponentCard,
    [ClanCardId.CatSearchRing]: CatSearchRing,
    [ClanCardId.CatUpgradeCardOrActivateTile]: CatUpgradeCardOrActivateTile,
    [ClanCardId.CatMilitaryOrFoodPerCardInHand]: CatMilitaryOrFoodPerCardInHand,
    [ClanCardId.CatSpyAndDraw]: CatSpyAndDraw,
    [ClanCardId.CatSpendRingForToken]: CatSpendRingForToken,
    [ClanCardId.CatFoodAndMilitary]: CatFoodAndMilitary,
    [ClanCardId.CatDrawAndFood]: CatDrawAndFood,
    [ClanCardId.CatMilitaryOrUpgrade]: CatMilitaryOrUpgrade,
    [ClanCardId.CatRingWinConflictByThree]: CatRingWinConflictByThree,
    [ClanCardId.CatRingEmptyDeck]: CatRingEmptyDeck,
    [ClanCardId.CatRingThreeCatCards]: CatRingThreeCatCards,
    [ClanCardId.CatRingFiveUpgradedTiles]: CatRingFiveUpgradedTiles,
    [ClanCardId.SharkUpgrade]: SharkUpgrade,
    [ClanCardId.SharkSpyOrTriggerToken]: SharkSpyOrTriggerToken,
    [ClanCardId.SharkPackRedrawToken]: SharkPackRedrawToken,
    [ClanCardId.SharkMilitary]: SharkMilitary,
    [ClanCardId.SharkMilitaryAndDraw]: SharkMilitaryAndDraw,
    [ClanCardId.SharkMilitaryPerToken]: SharkMilitaryPerToken,
    [ClanCardId.SharkPackDrawToken]: SharkPackDrawToken,
    [ClanCardId.SharkFoodOrDiscount]: SharkFoodOrDiscount,
    [ClanCardId.SharkFoodPerToken]: SharkFoodPerToken,
    [ClanCardId.SharkPackPlaceToken]: SharkPackPlaceToken,
    [ClanCardId.SharkPackSpy]: SharkPackSpy,
    [ClanCardId.ScorpionFoodPerDesertPair]: ScorpionFoodPerDesertPair,
    [ClanCardId.ScorpionMilitaryPerDesertPair]: ScorpionMilitaryPerDesertPair,
    [ClanCardId.ScorpionDrawAndFood]: ScorpionDrawAndFood,
    [ClanCardId.ScorpionDiscountPerDesertPair]: ScorpionDiscountPerDesertPair,
    [ClanCardId.ScorpionActivateDesert]: ScorpionActivateDesert,
    [ClanCardId.ScorpionUpgradeAndActivate]: ScorpionUpgradeAndActivate,
    [ClanCardId.ScorpionFoodAndPortalBonus]: ScorpionFoodAndPortalBonus,
    [ClanCardId.ScorpionPortalDoubleSpy]: ScorpionPortalDoubleSpy,
    [ClanCardId.ScorpionPortalFlipOpponentTile]: ScorpionPortalFlipOpponentTile,
    [ClanCardId.ScorpionPortalSwap]: ScorpionPortalSwap,
    [ClanCardId.ScorpionPortalBlockMilitaryVictory]: ScorpionPortalBlockMilitaryVictory
  }

  /** Every card of a clan has the same back, so the back is looked up from the clan the id belongs to. */
  backImages = Object.fromEntries(getEnumValues(ClanCardId).map((card) => [card, clanBacks[getClanCardClan(card)]])) as Record<ClanCardId, string>

  /** A deck is face down. A hand is not hidden yet: see the note on the hiding strategies in LedaRules. */
  isFlipped(item: Partial<MaterialItem<number, LocationType, ClanCardId>>) {
    return item.location?.type === LocationType.PlayerDeck
  }
}
