import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { LocationDescription } from '@gamepark/react-game'
import { actionTile } from './ActionTileDescription'
import { ActionTileDeckHelp } from './ActionTileDeckHelp'

/**
 * The pile of Action tiles as a spot of the table. It draws nothing of its own: a pile is the tiles it holds, and
 * this spot is only here so that the pile can be clicked as a pile, whichever of its tiles the pointer lands on
 * (see {@link ActionTileDeckHelp}).
 * It is the size of a tile, shadow included, so that its corners are the corners of the pile.
 */
export class ActionTileDeckDescription extends LocationDescription<number, MaterialType, LocationType> {
  width = actionTile.width
  height = actionTile.height
  borderRadius = 0.2

  help = ActionTileDeckHelp
}
