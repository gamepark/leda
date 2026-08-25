import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { ItemContext, MaterialContext, TokenDescription } from '@gamepark/react-game'
import { MaterialItem, MaterialMoveBuilder } from '@gamepark/rules-api'
import ActionTileBack from '../images/action-tiles/back.png'
import ActionTileBottomLeft from '../images/action-tiles/bottom-left.png'
import ActionTileBottomRight from '../images/action-tiles/bottom-right.png'
import ActionTileCornersOrCenter from '../images/action-tiles/corners-or-center.png'
import ActionTileTopLeft from '../images/action-tiles/top-left.png'
import ActionTileTopRight from '../images/action-tiles/top-right.png'
import { ActionTileHelp } from './ActionTileHelp'
import { isSpiedByOther } from './spiedItem'
import { SpiedItemButtons } from './SpiedItemButtons'
import { SpyHistoryButton } from './SpyHistoryButton'
import { SpyPileButton } from './SpyPileButton'

const actionTileRatio = 389 / 663

/**
 * The Action tile, and the transparent margin its image carries all around it, where the shadow of the tile is
 * drawn: 20 px of the 663 it is tall, which is 0.2 cm since the image is at 100 px per centimeter.
 */
export const actionTile = {
  width: 6.63 * actionTileRatio,
  height: 6.63,
  margin: (20 / 663) * 6.63
}

/** The 5 Action tiles. Their shadow is baked into the images, hence the transparency flag. */
export class ActionTileDescription extends TokenDescription<number, MaterialType, LocationType, ActionTileId> {
  height = actionTile.height
  ratio = actionTileRatio
  borderRadius = 0.2
  transparency = true

  images = {
    [ActionTileId.TopLeft]: ActionTileTopLeft,
    [ActionTileId.TopRight]: ActionTileTopRight,
    [ActionTileId.BottomLeft]: ActionTileBottomLeft,
    [ActionTileId.BottomRight]: ActionTileBottomRight,
    [ActionTileId.CornersOrCenter]: ActionTileCornersOrCenter
  }

  backImage = ActionTileBack

  /** Clicking a tile opens the zones it offers, and what the round does with them (see {@link ActionTileHelp}). */
  help = ActionTileHelp

  /**
   * All but a tile of the pile, which opens the help of that pile instead (see {@link ActionTileDeckHelp}): the
   * tiles of a pile are face down and shuffled, so the one on top is nothing more than the back of a tile, while
   * the pile is 5 known tiles minus the ones already revealed.
   */
  displayHelp(item: MaterialItem<number, LocationType, ActionTileId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type !== LocationType.ActionTileDeck) return super.displayHelp(item, context)
    return MaterialMoveBuilder.displayLocationHelp<number, MaterialType, LocationType>({ type: LocationType.ActionTileDeck })
  }

  /** The pile between the players is face down: a tile is only visible once revealed, or while it is spied. */
  isFlipped(item: Partial<MaterialItem<number, LocationType, ActionTileId>>, context: MaterialContext) {
    return item.location?.type === LocationType.ActionTileDeck || isSpiedByOther(item.location, context)
  }

  /** The pile and the spied tile carry the buttons of a Spy effect, which decide on their own whether to show. */
  menuAlwaysVisible = true

  getItemMenu(item: MaterialItem<number, LocationType, ActionTileId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type === LocationType.SpiedItem) return <SpiedItemButtons type={MaterialType.ActionTile} />
    if (item.location.type !== LocationType.ActionTileDeck) return
    return (
      <>
        <SpyPileButton type={MaterialType.ActionTile} index={context.index} />
        <SpyHistoryButton type={MaterialType.ActionTile} index={context.index} />
      </>
    )
  }
}
