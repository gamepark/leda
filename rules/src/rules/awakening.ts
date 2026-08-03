import { Material } from '@gamepark/rules-api'
import { ClanCardId, ClanCardItemId } from '../material/ClanCardId'
import { clanCardProperties } from '../material/clanCards/cardProperties'
import { PandaLevel } from '../material/clanCards/PandaLevel'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Rules } from '../Rules'

/**
 * What an Awakening looks at: the Pandas a player has on their grid and the ones they still hold.
 * The app reads it to know what to offer on the table, and {@link AwakeningRule} to know what is legal, so that
 * the two can never disagree.
 */

/** How many Pandas of a level have to be on the grid before one of them may be awakened. */
export const awakeningGroup = 2

/**
 * The 2 steps an Awakening may take: which level it sends back to its owner's hand, and which one takes the
 * square. A Gold Panda is the end of the line, so it is never the start of a step.
 */
export const awakeningSteps = [
  { from: PandaLevel.Bronze, to: PandaLevel.Silver },
  { from: PandaLevel.Silver, to: PandaLevel.Gold }
] as const

/**
 * The level of a card, undefined for anything that is not a levelled Panda (see {@link PandaLevel}), and undefined
 * too for a card the reader is not allowed to see: a hand is secret, so on the client of an opponent a card is
 * nothing but the back of its clan, with no front to read a level off (see {@link ClanCardItemId}).
 */
export const pandaLevel = (card?: ClanCardId): PandaLevel | undefined => (card === undefined ? undefined : clanCardProperties[card].pandaLevel)

const pandas = (cards: Material<number, MaterialType, LocationType>, level: PandaLevel) =>
  cards.id<ClanCardItemId>((id) => pandaLevel(id.front) === level)

/** The Pandas of a level a player has in play, which for a card means played onto a square of their grid. */
export const pandasInPlay = (rules: Rules, player: number, level: PandaLevel) =>
  pandas(rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(player), level)

/** The Pandas of a level a player still holds. */
export const pandasInHand = (rules: Rules, player: number, level: PandaLevel) =>
  pandas(rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(player), level)

