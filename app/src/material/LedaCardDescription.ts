import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { CardDescription, MaterialContentProps } from '@gamepark/react-game'

/**
 * A card of LEDA: the tiles of the grids, the clan cards played on them, and the Victory condition cards. They are
 * all the same 7 cm square, and they all give up their shine while the table is playing them down.
 *
 * A shine wins over a play down when the framework draws an item (see FlatMaterialDescription.contentWithBackChildren),
 * and the cards of the game are the ones that shine on their own: a square still to be activated is lit for as
 * long as the phase lasts, in either grid (see {@link TileDescription.highlight}). Playing an item down is how the
 * framework says everything a focus does not point at, so without this a tutorial popup naming one square would be
 * read on 4 squares lit exactly the same way, and the focus would say nothing at all.
 *
 * The other way round is what is wanted, and what this gives: the square a popup points at is the only one left
 * shining, and the ones the rules were lighting up go quiet until the popup is closed.
 */
export abstract class LedaCardDescription<ItemId> extends CardDescription<number, MaterialType, LocationType, ItemId> {
  content = (props: MaterialContentProps<ItemId, MaterialType>) =>
    this.contentWithBackChildren(props.playDown ? { ...props, highlight: false } : props)
}
