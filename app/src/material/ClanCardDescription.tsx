import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { ClanCardId, ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { isCellOfActivatedZone } from '@gamepark/leda/rules/activation'
import { swappingPlayer } from '@gamepark/leda/rules/swap'
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
import PandaBack from '../images/cards/panda/back.jpg'
import PandaDrawAndSpecialActivation from '../images/cards/panda/panda-draw-and-special-activation.jpg'
import PandaDrawOrMilitary from '../images/cards/panda/panda-draw-or-military.jpg'
import PandaFoodAndDiscount from '../images/cards/panda/panda-food-and-discount.jpg'
import PandaFoodAndSpy from '../images/cards/panda/panda-food-and-spy.jpg'
import PandaFoodOrMilitary from '../images/cards/panda/panda-food-or-military.jpg'
import PandaKing from '../images/cards/panda/panda-king.jpg'
import PandaMilitaryAndUpgrade from '../images/cards/panda/panda-military-and-upgrade.jpg'
import PandaMilitary from '../images/cards/panda/panda-military.jpg'
import PandaQueen from '../images/cards/panda/panda-queen.jpg'
import PandaSpyAndDiscount from '../images/cards/panda/panda-spy-and-discount.jpg'
import PandaUpgrade from '../images/cards/panda/panda-upgrade.jpg'
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
import { ClanCardHelp } from './ClanCardHelp'
import { PlayedCardMenuButton } from './PlayedCardMenuButton'
import { PutUnderDeckButton } from './PutUnderDeckButton'
import { isSpiedByOther } from './spiedItem'
import { SpiedItemButtons } from './SpiedItemButtons'
import { SpyHistoryButton } from './SpyHistoryButton'
import { SpyPileButton } from './SpyPileButton'
import { tileSize } from './TileDescription'

/** All the cards of a clan share one back, the emblem of that clan, including their Victory condition card. */
export const clanBacks: Record<Clan, string> = {
  [Clan.Panda]: PandaBack,
  [Clan.Shark]: SharkBack,
  [Clan.Cat]: CatBack,
  [Clan.Scorpion]: ScorpionBack
}

/**
 * The face of every clan card. Exported as well as used by the description below, so that a dialog offering cards
 * that are not on the table can draw them (see {@link SearchRingDialog}).
 */
export const clanCardFronts: Record<ClanCardId, string> = {
  [ClanCardId.PandaDrawAndSpecialActivation]: PandaDrawAndSpecialActivation,
  [ClanCardId.PandaUpgrade]: PandaUpgrade,
  [ClanCardId.PandaFoodOrMilitary]: PandaFoodOrMilitary,
  [ClanCardId.PandaFoodAndDiscount]: PandaFoodAndDiscount,
  [ClanCardId.PandaDrawOrMilitary]: PandaDrawOrMilitary,
  [ClanCardId.PandaFoodAndSpy]: PandaFoodAndSpy,
  [ClanCardId.PandaMilitary]: PandaMilitary,
  [ClanCardId.PandaMilitaryAndUpgrade]: PandaMilitaryAndUpgrade,
  [ClanCardId.PandaSpyAndDiscount]: PandaSpyAndDiscount,
  [ClanCardId.PandaKing]: PandaKing,
  [ClanCardId.PandaQueen]: PandaQueen,
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

/**
 * The clan cards a player draws and plays onto their grid. They are square, like the tiles they are played on.
 * Generated from the ClanCardId enum: an image file is named after the value it belongs to.
 */
export class ClanCardDescription extends CardDescription<number, MaterialType, LocationType, ClanCardItemId> {
  width = tileSize
  height = tileSize
  borderRadius = 0.5

  images = clanCardFronts

  /** Indexed by the back of the id, which is the clan. A hidden card keeps it, so its back can still be drawn. */
  backImages = clanBacks

  /** Clicking a card opens what it costs and what it gives, spelled out beside the card (see {@link ClanCardHelp}). */
  help = ClanCardHelp

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

  /** The buttons a card carries are read off the state of the game, and each decides on its own whether to show. */
  menuAlwaysVisible = true

  /**
   * A player only ever looks into their own deck, hence the Spy button on that one alone. What a deck was looked
   * into is another matter: both decks carry that mark, since a player is owed the news that their opponent read
   * the top of their own pile and maybe buried it (see {@link SpyHistoryButton}).
   */
  getItemMenu(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type === LocationType.SpiedItem) return <SpiedItemButtons type={MaterialType.ClanCard} />
    if (item.location.type === LocationType.PlayedCard) return <PlayedCardMenuButton index={context.index} />
    if (item.location.type === LocationType.PlayerHand) return <PutUnderDeckButton index={context.index} />
    if (item.location.type !== LocationType.PlayerDeck) return
    return (
      <>
        {item.location.player === context.player && <SpyPileButton type={MaterialType.ClanCard} index={context.index} />}
        <SpyHistoryButton type={MaterialType.ClanCard} index={context.index} player={item.location.player} />
      </>
    )
  }

  /**
   * While a player may swap 2 of their squares, the cards they played on their grid let the pointer through: a
   * square is taken by dragging its tile, which is exactly what these cards cover, and dropped onto a square just
   * the same. Only for as long as the swap is being asked, so that a card is clickable again, help dialog
   * included, as soon as there is nothing to drag underneath it.
   */
  getItemExtraCss(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    return this.coversATileToDrag(item, context) ? letTheTileThrough : undefined
  }

  /**
   * Such a card shines like the tile it covers, in the 2 cases where what the square carries is what shines and not
   * the card itself: the tile can be dragged, which is what says the square can be moved and which the framework
   * lights up on the tile alone, since the card has no move of its own; and the square is one of the zone being
   * activated, which shines for as long as the phase lasts (see {@link TileDescription.highlight}).
   * A card covers the whole tile of its square, so without this the zone would only be seen on the bare squares.
   */
  highlight(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    return this.coversATileToDrag(item, context) || this.coversAnActivatedSquare(item, context) || undefined
  }

  /**
   * Whether the card is played on a square the player watching is being asked to swap, hence on a tile they may
   * drag: while they organise their grid, and while a Scorpion Portal has them swap 2 squares
   * (see {@link swappingPlayer}). Their own grid and their own screen alone: there is nothing to drag out of a
   * grid one is only watching, where a card stays clickable and shines no more than the tile it covers.
   */
  coversATileToDrag(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>): boolean {
    if (item.location.type !== LocationType.PlayedCard || item.location.player !== context.player) return false
    return swappingPlayer(context.rules) === item.location.player
  }

  /**
   * Whether the card is played on a square of the zone the players are activating, in either grid. The square is
   * read off the tile the card is laid on, which is the parent item of its location, and not off the card.
   */
  coversAnActivatedSquare(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>): boolean {
    if (item.location.type !== LocationType.PlayedCard || item.location.parent === undefined) return false
    const tile = context.rules.material(MaterialType.Tile).getItem(item.location.parent)
    return tile !== undefined && isCellOfActivatedZone(context.rules, cellOf(tile.location))
  }
}

const letTheTileThrough = css`
  pointer-events: none;
`
