import { HidingSecretsStrategy, Material, MaterialItem, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { Clan } from '../Clan'
import { ClanCardItemId } from '../material/ClanCardId'
import { EffectQuantity } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf } from '../material/PlayerGrid'
import { Rules } from '../Rules'
import { topCardIndexOn, visibleCards } from './squares'

/**
 * What the Snakes are, which is one card read 2 ways.
 *
 * Their cards are double sided: the front is a Snake and the back is an Egg, and they are always played onto the
 * grid on their Egg side, for the 2 Food the Egg prints, whichever Snake they turn out to be. An Egg gives
 * nothing and hides what it is from the opponent; hatching it, for 2 Food again, turns it onto its Snake side,
 * where it gives what it prints and counts towards the 7 Snakes the clan wins on.
 *
 * Which side a card is showing is the rotation of its location, exactly as it is for a tile of a grid and for the
 * half turn of a Cat card: `true` is the Snake side. So a card played is an Egg with nothing to write down, and
 * hatching one is a move like any other (see {@link hatchCard}).
 */

/**
 * A card as anything reading a grid holds one, its id typed as loosely as the framework hands it over: what these
 * helpers are asked of is often a card whose front nobody here can read, which is the whole point of an Egg.
 */
type Card = MaterialItem<number, LocationType>

/** Both faces of a card, as far as they are known to whoever is reading it (see {@link ClanCardItemId}). */
const idOf = (card?: Card): ClanCardItemId | undefined => card?.id as ClanCardItemId | undefined

/**
 * What an Egg costs to play, and what hatching one costs again: the 2 numbers the Egg prints, which happen to be
 * the same. Named once for both, and read as "the price of the Egg" wherever it comes up.
 */
export const eggCost = 2

/** How many Snakes their owner has to have hatched and in play to win (see {@link specialVictoryGoals}). */
export const snakesToWin = 7

/** Whether a card belongs to the Snakes, which is read off its back and therefore true of an Egg nobody can read. */
export const isSnakeCard = (card?: Card): boolean => idOf(card)?.back === Clan.Snake

/**
 * Whether a Snake card in play has hatched. Asked of the card rather than of its front, which is exactly what an
 * Egg does not show its owner's opponent: both players count the Snakes of the table the same way
 * (see {@link LedaRules.hidingStrategies}).
 */
export const isHatched = (card?: Card): boolean => isSnakeCard(card) && card!.location.rotation === true

/** Whether a Snake card in play is still an Egg: the other side of the same question. */
export const isEgg = (card?: Card): boolean => isSnakeCard(card) && card!.location.rotation !== true

/**
 * The side an Egg is turned onto while a Spy effect reads it: its Snake side, up for both players for as long as the
 * look lasts, and still an Egg all the same, which gives nothing and counts as no Snake. Its owner already knows it
 * and there is nobody else at the table, so it is read where it lies (see {@link eggLookMoves}).
 * A value of the rotation beside `true`, which a hatched Snake alone is on, rather than a field of its own: the
 * rotation of a card is not part of where it stands, so the pile of cards on its square does not move.
 */
export const spiedSide = 'spied'

/** Whether a Snake card is an Egg a Spy effect has turned over to read. */
export const isSpiedEgg = (card?: Card): boolean => isSnakeCard(card) && card!.location.rotation === spiedSide

/**
 * What a card played on a grid hides: the front of an Egg, and from its owner's opponent alone.
 * The one hiding strategy of the game that reads the face an item is showing rather than the pile it is in, an
 * Egg being face up on the table and secret all the same (see {@link LedaRules.hidingStrategies}).
 *
 * The back is left alone, being the Egg everybody is looking at, and so is the side the card is on: how many
 * Snakes their owner has hatched is what both players count the game on, and neither of them counts it wrong
 * (see {@link specialVictoryCounts}).
 *
 * An Egg turned over by a Spy hides nothing: it is face up for both players, and turning it back hides it again.
 */
export const hiddenEgg: HidingSecretsStrategy<number, LocationType> = (item, player) =>
  isEgg(item) && !isSpiedEgg(item) && item.location.player !== player ? ['id.front'] : []

type Cards = Material<number, MaterialType, LocationType>

/**
 * The Snakes a player has hatched and can still see: what their clan counts to win, and what their own cards read
 * as "if you have N Snakes in play".
 * A card another one covers is out of play and out of the count, exactly as it is for every other clan
 * (see {@link visibleCards}).
 */
export const hatchedSnakes = (rules: Rules, player: number): Cards => visibleCards(rules, player).filter((card) => isHatched(card))

/** The Eggs a player has in play and has not hatched, which one of their cards moves and another one counts. */
export const playedEggs = (rules: Rules, player: number): Cards => visibleCards(rules, player).filter((card) => isEgg(card))

export const snakesInPlay = (rules: Rules, player: number): number => hatchedSnakes(rules, player).length

/**
 * What a Snake card written as "if you have N Snakes in play (including this one), ..." gives: the whole of it
 * once its owner is there, and nothing at all before.
 * The card itself is counted with no help from here: hatching it is what activates it, so it is already on its
 * Snake side by the time it is read (see {@link hatchCard}).
 */
export const withSnakes =
  (threshold: number, quantity = 1): EffectQuantity =>
  (rules, player) =>
    snakesInPlay(rules, player) >= threshold ? quantity : 0

/** The Food a player owns, which is what they pay their Eggs and their hatchings with. */
const food = (rules: Rules, player: number): number =>
  rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(player).getQuantity()

/** Whether a player can pay for one more hatching right now. */
export const canPayHatching = (rules: Rules, player: number): boolean => food(rules, player) >= eggCost

/** The Food spent to hatch an Egg, as the move that takes it off its owner. */
export const payHatching = (rules: Rules, player: number): MaterialMove<number, MaterialType, LocationType> =>
  rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(player).deleteItem(eggCost)

/** Whether the square of a player's grid holds an Egg of theirs, which is the square hatching one is asked on. */
export const eggIndexOn = (rules: Rules, player: number, cell: XYCoordinates): number | undefined => {
  const index = topCardIndexOn(rules, player, cell)
  if (index === undefined) return undefined
  return isEgg(rules.material(MaterialType.ClanCard).getItem(index)) ? index : undefined
}

/** The squares a Material of played cards stands on, which is where the tile each of them was laid over stands. */
export const cellsOf = (rules: Rules, cards: Cards): XYCoordinates[] => {
  const tiles = rules.material(MaterialType.Tile)
  return cards.getItems().flatMap((card) => (card.location.parent === undefined ? [] : [cellOf(tiles.getItem(card.location.parent).location)]))
}
