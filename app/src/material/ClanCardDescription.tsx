import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { ClanCardId, ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { organisingPlayer } from '@gamepark/leda/rules/organisation'
import { CardDescription, ItemContext, MaterialContext } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'
import CatBack from '../images/cards/cat/back.jpg'
import CatCopyOpponentCard from '../images/cards/cat/cat-copy-opponent-card.jpg'
import CatDrawAndFood from '../images/cards/cat/cat-draw-and-food.jpg'
import CatFoodAndMilitary from '../images/cards/cat/cat-food-and-military.jpg'
import CatMilitaryOrFoodPerCardInHand from '../images/cards/cat/cat-military-or-food-per-card-in-hand.jpg'
import CatMilitaryOrUpgrade from '../images/cards/cat/cat-military-or-upgrade.jpg'
import CatRingEmptyDeck from '../images/cards/cat/cat-ring-empty-deck.jpg'
import CatRingFiveUpgradedTiles from '../images/cards/cat/cat-ring-five-upgraded-tiles.jpg'
import CatRingThreeCatCards from '../images/cards/cat/cat-ring-three-cat-cards.jpg'
import CatRingWinConflictByThree from '../images/cards/cat/cat-ring-win-conflict-by-three.jpg'
import CatSearchRing from '../images/cards/cat/cat-search-ring.jpg'
import CatSpendRingForToken from '../images/cards/cat/cat-spend-ring-for-token.jpg'
import CatSpyAndDraw from '../images/cards/cat/cat-spy-and-draw.jpg'
import CatUpgradeCardOrActivateTile from '../images/cards/cat/cat-upgrade-card-or-activate-tile.jpg'
import ScorpionBack from '../images/cards/scorpion/back.jpg'
import ScorpionActivateDesert from '../images/cards/scorpion/scorpion-activate-desert.jpg'
import ScorpionDiscountPerDesertPair from '../images/cards/scorpion/scorpion-discount-per-desert-pair.jpg'
import ScorpionDrawAndFood from '../images/cards/scorpion/scorpion-draw-and-food.jpg'
import ScorpionFoodAndPortalBonus from '../images/cards/scorpion/scorpion-food-and-portal-bonus.jpg'
import ScorpionFoodPerDesertPair from '../images/cards/scorpion/scorpion-food-per-desert-pair.jpg'
import ScorpionMilitaryPerDesertPair from '../images/cards/scorpion/scorpion-military-per-desert-pair.jpg'
import ScorpionPortalBlockMilitaryVictory from '../images/cards/scorpion/scorpion-portal-block-military-victory.jpg'
import ScorpionPortalDoubleSpy from '../images/cards/scorpion/scorpion-portal-double-spy.jpg'
import ScorpionPortalFlipOpponentTile from '../images/cards/scorpion/scorpion-portal-flip-opponent-tile.jpg'
import ScorpionPortalSwap from '../images/cards/scorpion/scorpion-portal-swap.jpg'
import ScorpionUpgradeAndActivate from '../images/cards/scorpion/scorpion-upgrade-and-activate.jpg'
import SharkBack from '../images/cards/shark/back.jpg'
import SharkFoodOrDiscount from '../images/cards/shark/shark-food-or-discount.jpg'
import SharkFoodPerToken from '../images/cards/shark/shark-food-per-token.jpg'
import SharkMilitaryAndDraw from '../images/cards/shark/shark-military-and-draw.jpg'
import SharkMilitaryPerToken from '../images/cards/shark/shark-military-per-token.jpg'
import SharkMilitary from '../images/cards/shark/shark-military.jpg'
import SharkPackDrawToken from '../images/cards/shark/shark-pack-draw-token.jpg'
import SharkPackPlaceToken from '../images/cards/shark/shark-pack-place-token.jpg'
import SharkPackRedrawToken from '../images/cards/shark/shark-pack-redraw-token.jpg'
import SharkPackSpy from '../images/cards/shark/shark-pack-spy.jpg'
import SharkSpyOrTriggerToken from '../images/cards/shark/shark-spy-or-trigger-token.jpg'
import SharkUpgrade from '../images/cards/shark/shark-upgrade.jpg'
import { isSpiedByOther } from './spiedItem'
import { SpiedItemButtons } from './SpiedItemButtons'
import { SpyPileButton } from './SpyPileButton'
import { tileSize } from './TileDescription'

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
export class ClanCardDescription extends CardDescription<number, MaterialType, LocationType, ClanCardItemId> {
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

  /** Indexed by the back of the id, which is the clan. A hidden card keeps it, so its back can still be drawn. */
  backImages = clanBacks

  /**
   * Which face is up is decided by the location rather than left to the default, which flips a card whose front id
   * is missing: once the game is over the server reveals everything, so the fronts come back and a deck would turn
   * itself face up.
   */
  isFlipped(item: Partial<MaterialItem<number, LocationType, ClanCardItemId>>, context: MaterialContext) {
    return (
      item.location?.type === LocationType.PlayerDeck ||
      (item.location?.type === LocationType.PlayerHand && context.player !== item.location.player) ||
      isSpiedByOther(item.location, context)
    )
  }

  /** A player's own deck and the spied card carry the buttons of a Spy effect, which decide whether to show. */
  menuAlwaysVisible = true

  getItemMenu(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type === LocationType.SpiedItem) return <SpiedItemButtons type={MaterialType.ClanCard} />
    if (item.location.type !== LocationType.PlayerDeck || item.location.player !== context.player) return
    return <SpyPileButton type={MaterialType.ClanCard} index={context.index} />
  }

  /**
   * While a player organises their grid, the cards they played on it let the pointer through: a square is taken
   * by dragging its tile, which is exactly what these cards cover, and dropped onto a square just the same.
   * Only for as long as the phase lasts, so that a card is clickable again, help dialog included, as soon as
   * there is nothing to drag underneath it.
   */
  getItemExtraCss(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    return this.coversATileToDrag(item, context) ? letTheTileThrough : undefined
  }

  /**
   * Such a card shines like the tile it covers, which is what says the square can be dragged: the framework lights
   * up what can be moved, and the card itself has no move of its own, only the tile underneath does.
   */
  highlight(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    return this.coversATileToDrag(item, context) || undefined
  }

  /** Whether the card is played on a square of the grid its owner is organising, hence on a tile they may swap. */
  coversATileToDrag(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>): boolean {
    return item.location.type === LocationType.PlayedCard && organisingPlayer(context.rules) === item.location.player
  }
}

const letTheTileThrough = css`
  pointer-events: none;
`
