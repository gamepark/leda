import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { ItemContext, MaterialContext, TokenDescription } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'
import ActionTileBack from '../images/action-tiles/back.png'
import ActionTileBottomLeft from '../images/action-tiles/bottom-left.png'
import ActionTileBottomRight from '../images/action-tiles/bottom-right.png'
import ActionTileCornersOrCenter from '../images/action-tiles/corners-or-center.png'
import ActionTileTopLeft from '../images/action-tiles/top-left.png'
import ActionTileTopRight from '../images/action-tiles/top-right.png'
import { isSpiedByOther } from './spiedItem'
import { SpiedItemButtons } from './SpiedItemButtons'
import { SpyPileButton } from './SpyPileButton'

/** The 5 Action tiles. Their shadow is baked into the images, hence the transparency flag. */
export class ActionTileDescription extends TokenDescription<number, MaterialType, LocationType, ActionTileId> {
  height = 6.63
  ratio = 389 / 663
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

  /** The pile between the players is face down: a tile is only visible once revealed, or while it is spied. */
  isFlipped(item: Partial<MaterialItem<number, LocationType, ActionTileId>>, context: MaterialContext) {
    return item.location?.type === LocationType.ActionTileDeck || isSpiedByOther(item.location, context)
  }

  /** The pile and the spied tile carry the buttons of a Spy effect, which decide on their own whether to show. */
  menuAlwaysVisible = true

  getItemMenu(item: MaterialItem<number, LocationType, ActionTileId>, context: ItemContext<number, MaterialType, LocationType>) {
    if (item.location.type === LocationType.SpiedItem) return <SpiedItemButtons type={MaterialType.ActionTile} />
    if (item.location.type !== LocationType.ActionTileDeck) return
    return <SpyPileButton type={MaterialType.ActionTile} index={context.index} />
  }
}
