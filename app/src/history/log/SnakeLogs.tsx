import { LedaRules } from '@gamepark/leda/LedaRules'
import { ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { CustomMove, MoveItem } from '@gamepark/rules-api'
import { LogText } from '../LogText'
import { materialImage } from '../logMaterial'
import { MaterialLink } from '../MaterialLink'
import { revealedId } from '../revealedId'

/**
 * What a player of the Snakes does with the cards they have in play, which every other clan simply leaves where
 * it stands: they pay to open an Egg, they move one, and they turn a Snake back into one (see {@link snake}).
 */

/**
 * A player spends the 2 Food an Egg asks for. What it turns out to be is the next entry, on the move that turns
 * the card over: that is the move which reveals it, so it is the move everybody reads it on
 * (see {@link HatchedSnakeLog}).
 */
export const HatchEggLog = ({ context }: MaterialLogProps<CustomMove>) => {
  const player = usePlayerName(context.game.rule?.player)
  return <LogText code="log.hatch" values={{ player }} />
}

/**
 * The Egg turned onto its Snake side, which is what it was all along. Read by both players: the front of the card
 * was its owner's alone until this very move, and the move is what opens it to everybody
 * (see {@link LedaRules.hidingStrategies}).
 */
export const HatchedSnakeLog = (props: MaterialLogProps<MoveItem>) => <LogText code="log.hatched" components={{ material: <MovedCard {...props} /> }} />

/**
 * A Snake turned back onto its Egg side, which is what the 2 strongest cards of the clan are paid with. Its front
 * goes back to being its owner's alone, and the entry names it all the same: it was face up on the table until
 * this move, so there is nothing here their opponent did not see (see {@link FlipSnakeToEggRule}).
 */
export const FlipSnakeToEggLog = (props: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(props.move.location.player)
  return <LogText code="log.flip-snake-to-egg" values={{ player }} components={{ material: <MovedCard {...props} /> }} />
}

/**
 * The square of an Egg swapped with another square of its owner's grid. Which Egg it is is not said and never will
 * be: the card stays hidden as it follows its tile, which is the whole of what the clan plays for
 * (see {@link MoveEggRule}).
 */
export const MoveEggLog = ({ move }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(move.location.player)
  return <LogText code="log.move-egg" values={{ player }} />
}

/** The card the move is about, read as the move itself reveals it to whoever is reading the entry. */
const MovedCard = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const card = new LedaRules(context.game).material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex)
  return <MaterialLink type={MaterialType.ClanCard} item={{ id: revealedId(move, card) }} />
}

/**
 * A Spy effect spent reading an Egg of the opponent instead of a pile, which is the one way across the bluff of
 * the clan (see {@link spiableEggs}).
 *
 * The Egg is turned over for both players, so both read the Snake in their log: its owner off the card they have
 * always seen, and the reader off the move that showed it (see {@link spiedSide}).
 * The player is the one spending the Spy, whose turn it is, and not the owner the card stands in front of.
 */
export const SpyEggLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(context.game.rule?.player)
  const card = new LedaRules(context.game).material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex)
  const id = revealedId(move, card)
  if (materialImage(MaterialType.ClanCard, id) === undefined) return <LogText code="log.spy.egg" values={{ player }} />
  return <LogText code="log.spy.egg-seen" values={{ player }} components={{ material: <MaterialLink type={MaterialType.ClanCard} item={{ id }} /> }} />
}

/** The Egg turned back where it lies, which is the whole of what there is to decide about it. */
export const SpyEggReturnLog = ({ context }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(context.game.rule?.player)
  return <LogText code="log.spy-return.egg" values={{ player }} />
}
