import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { TokenDescription } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'
import ActionTileBack from '../images/action-tiles/back.png'
import ActionTileBottomLeft from '../images/action-tiles/bottom-left.png'
import ActionTileBottomRight from '../images/action-tiles/bottom-right.png'
import ActionTileCornersOrCenter from '../images/action-tiles/corners-or-center.png'
import ActionTileTopLeft from '../images/action-tiles/top-left.png'
import ActionTileTopRight from '../images/action-tiles/top-right.png'

/** The 5 Action tiles. Their shadow is baked into the images, hence the transparency flag. */
export class ActionTileDescription extends TokenDescription<number, MaterialType, LocationType, ActionTileId> {
  height = 4
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

  /** The pile between the players is face down: a tile is only visible once revealed. */
  isFlipped(item: Partial<MaterialItem<number, LocationType, ActionTileId>>) {
    return item.location?.type === LocationType.ActionTileDeck
  }
}
