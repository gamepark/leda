import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { isPermanent } from '@gamepark/leda/material/TileEffect'
import { TileId } from '@gamepark/leda/material/TileId'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { MoveItem } from '@gamepark/rules-api'
import { LogText } from '../LogText'
import { MaterialLink } from '../MaterialLink'

/**
 * What happens to the 16 tiles of a grid: a face turned over, or 2 squares changing places.
 *
 * A tile is never hidden, so every one of these is read by both players. The face the picture shows is the one
 * the tile ends up on, which is what the sentence is about.
 */

/** One tile, on the face the move leaves it on. */
const Tile = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const tile = new LedaRules(context.game).material(MaterialType.Tile).getItem<TileId>(move.itemIndex)
  return <MaterialLink type={MaterialType.Tile} item={tile} flipped={move.location.rotation === true} />
}

/** Whose grid the tile that moved belongs to. */
const useTileOwner = ({ move, context }: MaterialLogProps<MoveItem>) =>
  usePlayerName(new LedaRules(context.game).material(MaterialType.Tile).getItem(move.itemIndex)?.location.player)

/** An Upgrade: a permanent tile turned onto the stronger face it will show on every later activation. */
export const UpgradeTileLog = (props: MaterialLogProps<MoveItem>) => {
  const player = useTileOwner(props)
  return <LogText code="log.upgrade" values={{ player }} components={{ material: <Tile {...props} /> }} />
}

/** A Flip: a Desert turned back onto its front, where it can be activated again. */
export const FlipDesertLog = (props: MaterialLogProps<MoveItem>) => {
  const player = useTileOwner(props)
  return <LogText code="log.flip" values={{ player }} components={{ material: <Tile {...props} /> }} />
}

/**
 * What a Scorpion Portal makes an opponent do: a tile turned onto its worse face, which is the Desert of a
 * temporary tile and the non upgraded front of a permanent one (see {@link DowngradeTileRule}).
 */
export const DowngradeTileLog = (props: MaterialLogProps<MoveItem>) => {
  const player = useTileOwner(props)
  const tile = new LedaRules(props.context.game).material(MaterialType.Tile).getItem<TileId>(props.move.itemIndex)
  if (tile?.id === undefined) return null
  return <LogText code={isPermanent(tile.id) ? 'log.downgrade-front' : 'log.downgrade-desert'} values={{ player }} components={{ material: <Tile {...props} /> }} />
}

/**
 * Two squares changing places, with whatever is played on them. Only the first half of the swap is logged: the
 * second one is the tile it displaced going the other way, and the two are one move for the player.
 */
export const SwapSquaresLog = (props: MaterialLogProps<MoveItem>) => {
  const player = useTileOwner(props)
  return <LogText code="log.swap" values={{ player }} />
}
