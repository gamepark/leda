import { LedaRules } from '@gamepark/leda/LedaRules'
import { ClanCardId, ClanCardItemId, clanOf } from '@gamepark/leda/material/ClanCardId'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { CustomMove, MoveItem, XYCoordinates } from '@gamepark/rules-api'
import { LogText } from '../LogText'
import { MaterialLink } from '../MaterialLink'
import { materialImage, revealedId } from '../logMaterial'
import { SquareMaterial } from './SquareMaterial'

/** What a player does with the clan cards they hold, and with the ones they have already played. */

/**
 * The card that was moved, as the piece the sentence names. A card played onto a grid is face up whoever plays it,
 * so this is read by everybody; a card going back under a deck is not, and its entry says so on its own
 * (see {@link SpendRingLog}).
 */
const PlayedCard = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const card = new LedaRules(context.game).material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex)
  return <MaterialLink type={MaterialType.ClanCard} item={{ id: revealedId(move, card) }} />
}

/** A card played onto a square of its owner's grid: the whole of an organisation, or what an effect let them do. */
export const PlayCardLog = (props: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(props.move.location.player)
  return <LogText code="log.play-card" values={{ player }} components={{ material: <PlayedCard {...props} /> }} />
}

/** A Panda raised to the level above, which takes the square of one of the level below (see {@link AwakeningRule}). */
export const AwakenLog = (props: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(props.move.location.player)
  return <LogText code="log.awaken" values={{ player }} components={{ material: <PlayedCard {...props} /> }} />
}

/** A Ring put in play for free, its condition being met. 3 of them in play win the game (see {@link PlaceRingRule}). */
export const PlaceRingLog = (props: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(props.move.location.player)
  return <LogText code="log.place-ring" values={{ player }} components={{ material: <PlayedCard {...props} /> }} />
}

/**
 * One card of the price of the 3 Cat cards that are paid with cards rather than with Food. Which card it is stays
 * a secret: it leaves a hand its opponent cannot read for a deck nobody can, so nothing is revealed by the move.
 */
export const PayCardLog = ({ move }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(move.location.player)
  return <LogText code="log.pay-card" values={{ player }} />
}

/**
 * A Ring traded for a Military Victory token, which sends it under its owner's deck. Like a card paid with, it
 * goes from a hand to a deck, so only its owner ever reads which of the 4 Rings it was.
 */
export const SpendRingLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(move.location.player)
  const card = new LedaRules(context.game).material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex)
  const id = revealedId(move, card)
  if (materialImage(MaterialType.ClanCard, id) === undefined) return <LogText code="log.spend-ring" values={{ player }} />
  return <LogText code="log.spend-ring-seen" values={{ player }} components={{ material: <MaterialLink type={MaterialType.ClanCard} item={{ id }} /> }} />
}

/**
 * A Ring taken out of a deck. The player names the Ring rather than where it is, so the move itself says which one
 * it is and everybody reads it: the Rings are the win condition of the Cats, and their opponent is entitled to
 * know one is on its way (see {@link SearchRingRule}).
 */
export const SearchRingLog = ({ move, context }: MaterialLogProps<CustomMove>) => {
  const player = usePlayerName(context.game.rule?.player)
  const ring = move.data as ClanCardId | undefined
  if (ring === undefined) return null
  const item = { id: { front: ring, back: clanOf(ring) } }
  return <LogText code="log.search-ring" values={{ player }} components={{ material: <MaterialLink type={MaterialType.ClanCard} item={item} /> }} />
}

/** A Cat card turned half a turn onto its other effect, without being activated (see {@link RotateCatCardRule}). */
export const RotateCatCardLog = ({ move, context }: MaterialLogProps<CustomMove>) => {
  const rules = new LedaRules(context.game)
  const owner = context.game.rule?.player
  const player = usePlayerName(owner)
  const cell = move.data as XYCoordinates | undefined
  if (cell === undefined || owner === undefined) return null
  return <LogText code="log.rotate" values={{ player }} components={{ material: <SquareMaterial rules={rules} player={owner} cell={cell} /> }} />
}
