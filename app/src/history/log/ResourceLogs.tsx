import { LedaRules } from '@gamepark/leda/LedaRules'
import { ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { CreateItem, DeleteItem, MoveItem } from '@gamepark/rules-api'
import { LogText } from '../LogText'
import { MaterialLink } from '../MaterialLink'
import { materialImage, revealedId } from '../logMaterial'

/** The 2 things a player gathers that are counted rather than played: their Food, and the cards of their hand. */

/** Food gained, which a tile, a card or a Military Victory token gives. */
export const FoodGainLog = ({ move }: MaterialLogProps<CreateItem>) => {
  const player = usePlayerName(move.item.location.player)
  return <LogText code="log.food-gain" values={{ player, count: move.item.quantity ?? 1 }} />
}

/**
 * The Food an Awakening that cannot be resolved is worth: the group of Pandas it takes is not on the grid, or none
 * of the level above is left in hand to take the square, and the crystal falls back onto its other branch
 * (see {@link AwakeningRule}).
 * An entry of its own rather than one indented under a square: it is not what the last square activated gave, but
 * what the whole zone came to once it was done.
 */
export const AwakeningLostLog = ({ move }: MaterialLogProps<CreateItem>) => {
  const player = usePlayerName(move.item.location.player)
  return <LogText code="log.awakening-lost" values={{ player, count: move.item.quantity ?? 1 }} />
}

/**
 * The Food an organisation is worth, which its player takes whether they swapped 2 of their squares for it or
 * simply took it. Its own entry because it is the whole of what a player did with their turn, and not something
 * an effect gave them along the way (see {@link OrganisationRule}).
 */
export const OrganisationFoodLog = ({ move }: MaterialLogProps<CreateItem>) => {
  const player = usePlayerName(move.item.location.player)
  return <LogText code="log.organisation-food" values={{ player, count: move.item.quantity ?? 1 }} />
}

/** Food spent, which is what a clan card played costs its owner. */
export const FoodSpendLog = ({ move, context }: MaterialLogProps<DeleteItem>) => {
  const food = new LedaRules(context.game).material(MaterialType.FoodToken).getItem(move.itemIndex)
  const player = usePlayerName(food?.location.player)
  return <LogText code="log.food-spend" values={{ player, count: move.quantity ?? 1 }} />
}

/** Food taken from the opponent, which lands in the reserve of the player taking it. */
export const StealFoodLog = ({ move }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(move.location.player)
  return <LogText code="log.food-steal" values={{ player, count: move.quantity ?? 1 }} />
}

/**
 * A card drawn. Which card it is is only revealed to the player drawing it, a deck being hidden from its owner
 * too until they take a card out of it, so their opponent reads that a card was drawn and nothing more.
 * Once the game is over the server opens everything, and both sentences are then read with the card in them.
 */
export const DrawLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(move.location.player)
  const card = new LedaRules(context.game).material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex)
  const id = revealedId(move, card)
  if (materialImage(MaterialType.ClanCard, id) === undefined) return <LogText code="log.draw" values={{ player }} />
  return <LogText code="log.draw-seen" values={{ player }} components={{ material: <MaterialLink type={MaterialType.ClanCard} item={{ id }} /> }} />
}
