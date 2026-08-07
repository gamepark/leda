import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { TileId } from '@gamepark/leda/material/TileId'
import { isActivationPhase, isCellOfActivatedZone } from '@gamepark/leda/rules/activation'
import { swappingPlayer } from '@gamepark/leda/rules/swap'
import { CardDescription, ItemContext } from '@gamepark/react-game'
import { MaterialItem, MaterialMoveBuilder } from '@gamepark/rules-api'
import PermanentDrawFront from '../images/tiles/recto/permanent-draw.jpg'
import PermanentFoodFront from '../images/tiles/recto/permanent-food.jpg'
import PermanentMilitaryFront from '../images/tiles/recto/permanent-military.jpg'
import PermanentSpecialActivationFront from '../images/tiles/recto/permanent-special-activation.jpg'
import TemporaryDrawFront from '../images/tiles/recto/temporary-draw.jpg'
import TemporaryFoodFront from '../images/tiles/recto/temporary-food.jpg'
import TemporaryMilitaryFront from '../images/tiles/recto/temporary-military.jpg'
import TemporarySpecialActivationFront from '../images/tiles/recto/temporary-special-activation.jpg'
import TemporaryUpgradeFront from '../images/tiles/recto/temporary-upgrade.jpg'
import PermanentDrawBack from '../images/tiles/verso/permanent-draw.jpg'
import PermanentFoodBack from '../images/tiles/verso/permanent-food.jpg'
import PermanentMilitaryBack from '../images/tiles/verso/permanent-military.jpg'
import PermanentSpecialActivationBack from '../images/tiles/verso/permanent-special-activation.jpg'
import TemporaryDrawBack from '../images/tiles/verso/temporary-draw.jpg'
import TemporaryFoodBack from '../images/tiles/verso/temporary-food.jpg'
import TemporaryMilitaryBack from '../images/tiles/verso/temporary-military.jpg'
import TemporarySpecialActivationBack from '../images/tiles/verso/temporary-special-activation.jpg'
import TemporaryUpgradeBack from '../images/tiles/verso/temporary-upgrade.jpg'
import { TileHelp } from './TileHelp'
import { TileMenuButton } from './TileMenuButton'

/**
 * Sizes are in centimeters. The tiles are 7 cm square: their artboards are 700 px at 254 dpi, which is exactly
 * 10 px per millimeter. The clan cards are played onto the tiles and have the same size.
 * The other pieces carry no reliable dpi, so their size is an estimate read off the setup illustration of the
 * rulebook; only their ratio comes from the images.
 */
export const tileSize = 7

/**
 * The gap a grid leaves between 2 of its squares. It belongs here rather than to the layout of the table, because
 * what is drawn over a grid is measured from it as much as the grid itself is (see {@link ActionZoneDescription}).
 */
export const gridGap = 0.3

/** The 16 double sided tiles of a player's grid. They are square, hence the same width and height. */
export class TileDescription extends CardDescription<number, MaterialType, LocationType, TileId> {
  width = tileSize
  height = tileSize
  borderRadius = 0.5

  images = {
    [TileId.PermanentDraw]: PermanentDrawFront,
    [TileId.PermanentSpecialActivation]: PermanentSpecialActivationFront,
    [TileId.PermanentFood]: PermanentFoodFront,
    [TileId.PermanentMilitary]: PermanentMilitaryFront,
    [TileId.TemporaryFood]: TemporaryFoodFront,
    [TileId.TemporaryDraw]: TemporaryDrawFront,
    [TileId.TemporaryUpgrade]: TemporaryUpgradeFront,
    [TileId.TemporarySpecialActivation]: TemporarySpecialActivationFront,
    [TileId.TemporaryMilitary]: TemporaryMilitaryFront
  }

  backImages = {
    [TileId.PermanentDraw]: PermanentDrawBack,
    [TileId.PermanentSpecialActivation]: PermanentSpecialActivationBack,
    [TileId.PermanentFood]: PermanentFoodBack,
    [TileId.PermanentMilitary]: PermanentMilitaryBack,
    [TileId.TemporaryFood]: TemporaryFoodBack,
    [TileId.TemporaryDraw]: TemporaryDrawBack,
    [TileId.TemporaryUpgrade]: TemporaryUpgradeBack,
    [TileId.TemporarySpecialActivation]: TemporarySpecialActivationBack,
    [TileId.TemporaryMilitary]: TemporaryMilitaryBack
  }

  /** Clicking a tile opens what each of its 2 faces gives, and which kind of tile it is (see {@link TileHelp}). */
  help = TileHelp

  /** A tile shows its back once it has been upgraded, or flipped to its Desert side. */
  isFlipped(item: Partial<MaterialItem<number, LocationType, TileId>>) {
    return item.location?.rotation === true
  }

  /**
   * The squares of the player's own grid always carry their menu: the button inside it is what decides whether
   * there is anything to offer, and it has to be mounted to do so (see {@link TileMenuButton}).
   */
  menuAlwaysVisible = true

  getItemMenu(item: MaterialItem<number, LocationType, TileId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type !== LocationType.PlayerGrid || item.location.player !== context.player) return
    return <TileMenuButton index={context.index} />
  }

  /**
   * Once the zone is picked, it shines in both grids until both players have activated it, the rules an effect
   * opens along the way included: the phase is not over, and the player has to keep seeing where they are.
   * Unlike the css below, this is read by the parent of the item on every render, so it is refreshed for every
   * square as soon as the rules move on, and not only for the squares whose own item changed.
   *
   * Except while a player is being asked to swap 2 of their squares, which a Scorpion Portal asks in the middle of
   * that very activation: nothing is said of any square then, in either grid, and what the framework shines on its
   * own is exactly what is being asked, the squares it has a move for. Saying no here would be saying it of the
   * whole grid to be swapped as well, and turn that shine off with it (see {@link isCellOfActivatedZone}).
   */
  highlight(item: MaterialItem<number, LocationType, TileId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (!isActivationPhase(context.rules) || item.location.type !== LocationType.PlayerGrid) return undefined
    if (swappingPlayer(context.rules) !== undefined) return undefined
    return isCellOfActivatedZone(context.rules, cellOf(item.location))
  }

  /**
   * A card played on a square covers its tile entirely, and while its owner organises their grid it lets the
   * pointer through so that the tile can be dragged (see ClanCardDescription.getItemExtraCss): clicking a covered
   * square then opens the help about the card the player sees, the topmost one, rather than about the tile hidden
   * underneath, which no click could reach any more.
   */
  displayHelp(item: MaterialItem<number, LocationType, TileId>, context: ItemContext<number, MaterialType, LocationType>) {
    const cardIndex = this.topCardIndex(context)
    if (cardIndex === undefined) return super.displayHelp(item, context)
    const card = context.rules.material(MaterialType.ClanCard).getItem(cardIndex)
    return MaterialMoveBuilder.displayMaterialHelp<number, MaterialType, LocationType>(MaterialType.ClanCard, card, cardIndex)
  }

  /** The card laid last on the square of this tile, hence the one over all the others, if the square carries any. */
  topCardIndex(context: ItemContext<number, MaterialType, LocationType>): number | undefined {
    const indexes = context.rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).parent(context.index).getIndexes()
    return indexes.length > 0 ? Math.max(...indexes) : undefined
  }
}
