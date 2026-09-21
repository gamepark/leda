import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { ClanCardId, ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { isCellLeftToActivate } from '@gamepark/leda/rules/activation'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { isEgg, isSpiedEgg } from '@gamepark/leda/rules/snake'
import { swappingPlayer } from '@gamepark/leda/rules/swap'
import { ItemContext, MaterialContentProps, MaterialContext } from '@gamepark/react-game'
import { MaterialItem, MaterialMoveBuilder } from '@gamepark/rules-api'
import CatBack from '../images/cards/cat/back.jpg'
import CatEmblem from '../images/cards/cat/emblem.jpg'
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
import PandaEmblem from '../images/cards/panda/emblem.jpg'
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
import ScorpionEmblem from '../images/cards/scorpion/emblem.jpg'
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
import SharkEmblem from '../images/cards/shark/emblem.jpg'
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
import SnakeBack from '../images/cards/snake/back.jpg'
import SnakeEmblem from '../images/cards/snake/emblem.jpg'
import SnakeCopySnake from '../images/cards/snake/snake-copy-snake.jpg'
import SnakeDrawAndFlipDesert from '../images/cards/snake/snake-draw-and-flip-desert.jpg'
import SnakeDrawAndFoodPerEgg from '../images/cards/snake/snake-draw-and-food-per-egg.jpg'
import SnakeDrawPlayCardAndFlipBack from '../images/cards/snake/snake-draw-play-card-and-flip-back.jpg'
import SnakeMilitary from '../images/cards/snake/snake-military.jpg'
import SnakeMilitaryVictoryAndFlipBack from '../images/cards/snake/snake-military-victory-and-flip-back.jpg'
import SnakeMilitaryWithThreeSnakes from '../images/cards/snake/snake-military-with-three-snakes.jpg'
import SnakeSpyAndMilitary from '../images/cards/snake/snake-spy-and-military.jpg'
import SnakeSpyAndUpgrade from '../images/cards/snake/snake-spy-and-upgrade.jpg'
import SnakeStealFoodAndMilitary from '../images/cards/snake/snake-steal-food-and-military.jpg'
import SnakeStealFoodAndMoveEgg from '../images/cards/snake/snake-steal-food-and-move-egg.jpg'
import { ClanCardHelp } from './ClanCardHelp'
import { EggPeek, eggPeekOnHover } from './EggPeek'
import { HatchEggButton } from './HatchEggButton'
import { LedaCardDescription } from './LedaCardDescription'
import { ActivationLockButton } from './ActivationLockButton'
import { PlayedCardMenuButton } from './PlayedCardMenuButton'
import { PutUnderDeckButton } from './PutUnderDeckButton'
import { isSpiedByOther } from './spiedItem'
import { SpiedItemButtons } from './SpiedItemButtons'
import { EggSpyHistoryButton, SpyHistoryButton } from './SpyHistoryButton'
import { SpyPileButton } from './SpyPileButton'
import { SwapHistoryButton } from './SwapHistoryButton'
import { tileSize } from './TileDescription'

/**
 * The back of the cards of a clan: the emblem of that clan for the 4 of the base box, which is what a card face
 * down in a deck or held in a hand shows.
 *
 * The Snakes are the one clan whose cards are not backed by their emblem but by an Egg, the same Egg on all 11 of
 * them: their deck is a pile of Eggs, and so is what they play onto their grid (see {@link snake}).
 */
export const clanBacks: Record<Clan, string> = {
  [Clan.Panda]: PandaBack,
  [Clan.Shark]: SharkBack,
  [Clan.Cat]: CatBack,
  [Clan.Scorpion]: ScorpionBack,
  [Clan.Snake]: SnakeBack
}

/**
 * The emblem of a clan, which is what stands for it where the clan itself is being shown rather than one of its
 * cards: the choice of a clan during setup (see {@link ChooseClanDialog}).
 * The back of the Victory condition card, which crowns the emblem the other cards of the clan carry with a laurel
 * wreath: a clan is picked as a whole, and the card it hands over first is the one that says how it wins.
 */
export const clanEmblems: Record<Clan, string> = {
  [Clan.Panda]: PandaEmblem,
  [Clan.Shark]: SharkEmblem,
  [Clan.Cat]: CatEmblem,
  [Clan.Scorpion]: ScorpionEmblem,
  [Clan.Snake]: SnakeEmblem
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
  [ClanCardId.ScorpionPortalBlockMilitaryVictory]: ScorpionPortalBlockMilitaryVictory,
  [ClanCardId.SnakeStealFoodAndMilitary]: SnakeStealFoodAndMilitary,
  [ClanCardId.SnakeDrawAndFlipDesert]: SnakeDrawAndFlipDesert,
  [ClanCardId.SnakeSpyAndUpgrade]: SnakeSpyAndUpgrade,
  [ClanCardId.SnakeMilitary]: SnakeMilitary,
  [ClanCardId.SnakeDrawAndFoodPerEgg]: SnakeDrawAndFoodPerEgg,
  [ClanCardId.SnakeStealFoodAndMoveEgg]: SnakeStealFoodAndMoveEgg,
  [ClanCardId.SnakeSpyAndMilitary]: SnakeSpyAndMilitary,
  [ClanCardId.SnakeMilitaryWithThreeSnakes]: SnakeMilitaryWithThreeSnakes,
  [ClanCardId.SnakeCopySnake]: SnakeCopySnake,
  [ClanCardId.SnakeMilitaryVictoryAndFlipBack]: SnakeMilitaryVictoryAndFlipBack,
  [ClanCardId.SnakeDrawPlayCardAndFlipBack]: SnakeDrawPlayCardAndFlipBack
}

/**
 * The clan cards a player draws and plays onto their grid. They are square, like the tiles they are played on.
 * Generated from the ClanCardId enum: an image file is named after the value it belongs to.
 */
export class ClanCardDescription extends LedaCardDescription<ClanCardItemId> {
  width = tileSize
  height = tileSize
  borderRadius = 0.5

  images = clanCardFronts

  /** Indexed by the back of the id, which is the clan. A hidden card keeps it, so its back can still be drawn. */
  backImages = clanBacks

  /** Clicking a card opens what it costs and what it gives, spelled out beside the card (see {@link ClanCardHelp}). */
  help = ClanCardHelp

  /**
   * All but a card of a deck, which opens the help of that deck instead (see {@link PlayerDeckHelp}): the cards of
   * a pile are face down and shuffled, so the one on top is nothing more than the back of a clan, and reading
   * "this card is face down" off it says less than the pile it belongs to does.
   */
  displayHelp(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type !== LocationType.PlayerDeck) return super.displayHelp(item, context)
    return MaterialMoveBuilder.displayLocationHelp<number, MaterialType, LocationType>({
      type: LocationType.PlayerDeck,
      player: item.location.player
    })
  }

  /**
   * Which face is up is decided by the location rather than left to the default, which flips a card whose front id
   * is missing: once the game is over the server reveals everything, so the fronts come back and a deck would turn
   * itself face up.
   *
   * A Snake played on its Egg side is the one card of the game that is face down on a square of a grid, and it is
   * face down for its owner too: they know which Snake it is, and what the table shows is the Egg either way, so
   * this is asked of the card and not of who is looking at it (see {@link snake}).
   */
  isFlipped(item: Partial<MaterialItem<number, LocationType, ClanCardItemId>>, context: MaterialContext) {
    return (
      item.location?.type === LocationType.PlayerDeck ||
      (item.location?.type === LocationType.PlayerHand && context.player !== item.location.player) ||
      isSpiedByOther(item.location, context) ||
      showsAnEgg(item)
    )
  }

  /**
   * The help of an Egg shows the Snake it is to whoever can read it, which is its owner: the table draws the Egg,
   * since that is what the square shows, but the help is where a player looks up what their own card does.
   * An Egg of the opponent has no front to show, and stays an Egg there as it does on the table.
   */
  isFlippedInDialog(item: Partial<MaterialItem<number, LocationType, ClanCardItemId>>, context: MaterialContext) {
    if (showsAnEgg(item) && item.id?.front !== undefined) return false
    return this.isFlipped(item, context)
  }

  /**
   * A Snake its reader knows is wrapped in what turns an Egg face up under the pointer (see {@link EggPeek}): the
   * front is only there for the owner (see {@link hiddenEgg}), so the opponent's Eggs stay Eggs.
   */
  content = (props: MaterialContentProps<ClanCardItemId, MaterialType>) =>
    props.itemId?.back === Clan.Snake && props.itemId.front !== undefined ? <EggPeek>{this.faces(props)}</EggPeek> : this.faces(props)

  /** The buttons a card carries are read off the state of the game, and each decides on its own whether to show. */
  menuAlwaysVisible = true

  /**
   * A player only ever looks into their own deck, hence the Spy button on that one alone. What a deck was looked
   * into is another matter: both decks carry that mark, since a player is owed the news that their opponent read
   * the top of their own pile and maybe buried it (see {@link SpyHistoryButton}).
   *
   * A card played on a grid covers the tile of its square, buttons included, so it carries the mark of a swap and
   * the lock of a square already activated in place of the tile it hides, and asks for both through that very tile
   * (see {@link SwapHistoryButton} and {@link ActivationLockButton}). It carries the mark of a Spy that read it
   * while it was an Egg as well, which is the card's own and not its square's (see {@link EggSpyHistoryButton}).
   */
  getItemMenu(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type === LocationType.SpiedItem) return <SpiedItemButtons type={MaterialType.ClanCard} />
    if (item.location.type === LocationType.PlayedCard)
      return (
        <>
          <PlayedCardMenuButton index={context.index} />
          <HatchEggButton index={context.index} />
          {item.location.parent !== undefined && <ActivationLockButton tile={item.location.parent} />}
          {item.location.parent !== undefined && <SwapHistoryButton tile={item.location.parent} />}
          <EggSpyHistoryButton index={context.index} />
        </>
      )
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
   *
   * An Egg its reader knows turns face up under the pointer, on the table alone and not while it is dragged
   * (see {@link eggPeekOnHover}).
   */
  getItemExtraCss(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (this.coversATileToDrag(item, context)) return letTheTileThrough
    return showsAnEgg(item) && item.id?.front !== undefined && !context.isDragging ? eggPeekOnHover : undefined
  }

  /**
   * Such a card shines like the tile it covers, in the 2 cases where what the square carries is what shines and not
   * the card itself: the tile can be dragged, which is what says the square can be moved and which the framework
   * lights up on the tile alone, since the card has no move of its own; and the square is one still to be
   * activated, which shines until its owner has resolved it (see {@link TileDescription.highlight}).
   * A card covers the whole tile of its square, so without this the zone would only be seen on the bare squares.
   * A Snake moving an Egg only lets the squares of its Eggs be taken, hence only the Eggs shine then
   * (see {@link MoveEggRule}).
   */
  highlight(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>) {
    const draggable = this.coversATileToDrag(item, context) && (context.rules.game.rule?.id !== RuleId.MoveEgg || isEgg(item))
    return draggable || this.coversAnActivatedSquare(item, context) || undefined
  }

  /**
   * Whether the card is played on a square the player watching is being asked to swap, hence on a tile they may
   * drag: while they organise their grid, while a Scorpion Portal has them swap 2 squares, and while a Snake has
   * them move an Egg (see {@link swappingPlayer}). Their own grid and their own screen alone: there is nothing to drag out of a
   * grid one is only watching, where a card stays clickable and shines no more than the tile it covers.
   */
  coversATileToDrag(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>): boolean {
    if (item.location.type !== LocationType.PlayedCard || item.location.player !== context.player) return false
    return swappingPlayer(context.rules) === item.location.player
  }

  /**
   * Whether the card is played on a square its owner still has to activate, in either grid. The square is read off
   * the tile the card is laid on, which is the parent item of its location, and not off the card: the owner of that
   * tile is whose grid the square belongs to, and the card is what the square gives when it is activated.
   */
  coversAnActivatedSquare(item: MaterialItem<number, LocationType, ClanCardItemId>, context: ItemContext<number, MaterialType, LocationType>): boolean {
    if (item.location.type !== LocationType.PlayedCard || item.location.parent === undefined) return false
    const tile = context.rules.material(MaterialType.Tile).getItem(item.location.parent)
    if (tile === undefined || tile.location.player === undefined) return false
    return isCellLeftToActivate(context.rules, tile.location.player, cellOf(tile.location))
  }
}

const letTheTileThrough = css`
  pointer-events: none;
`

/**
 * Whether the card is a Snake lying on its Egg side, which is the face the table draws: the back of the card, and
 * the same Egg on all 11 of them (see {@link clanBacks}).
 * Read off the location, which is where the side of a card is written down, so a card being dragged and a card
 * standing on a square are read the same way.
 */
const showsAnEgg = (item: Partial<MaterialItem<number, LocationType, ClanCardItemId>>): boolean =>
  item.location?.type === LocationType.PlayedCard &&
  isEgg(item as MaterialItem<number, LocationType>) &&
  !isSpiedEgg(item as MaterialItem<number, LocationType>)
