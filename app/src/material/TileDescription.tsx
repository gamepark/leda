import { css } from '@emotion/react'
import { zoneContains } from '@gamepark/leda/material/ActionZone'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { TileId } from '@gamepark/leda/material/TileId'
import { roundZone } from '@gamepark/leda/rules/activation'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { CardDescription, ItemContext } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'
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
import { copper, parchment } from '../theme'
import { TileMenuButton } from './TileMenuButton'

/**
 * Sizes are in centimeters. The tiles are 7 cm square: their artboards are 700 px at 254 dpi, which is exactly
 * 10 px per millimeter. The clan cards are played onto the tiles and have the same size.
 * The other pieces carry no reliable dpi, so their size is an estimate read off the setup illustration of the
 * rulebook; only their ratio comes from the images.
 */
export const tileSize = 7

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
   * Once the zone is picked, it shines in both grids until both players have activated it.
   * Unlike the css below, this is read by the parent of the item on every render, so it is refreshed for every
   * square as soon as the rules move on, and not only for the squares whose own item changed.
   */
  highlight(item: MaterialItem<number, LocationType, TileId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (context.rules.game.rule?.id !== RuleId.ActivateZone || item.location.type !== LocationType.PlayerGrid) return undefined
    const zone = roundZone(context.rules)
    return zone !== undefined && zoneContains(zone, cellOf(item.location))
  }

  /** A square the active player selected is ringed, in their own grid and in their opponent's. */
  getItemExtraCss(item: MaterialItem<number, LocationType, TileId>) {
    return item.selected ? selectedTile : undefined
  }
}

/**
 * The ring is as thick as the gap between 2 squares, so that the rings of a selected zone meet and read as one
 * border drawn around it. The parchment line inside the copper one keeps it visible over any tile artwork.
 */
const selectedTile = css`
  border-radius: 0.5em;
  box-shadow:
    0 0 0 0.15em ${parchment},
    0 0 0 0.3em ${copper};
`
