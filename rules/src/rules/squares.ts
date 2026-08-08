import { XYCoordinates } from '@gamepark/rules-api'
import { ClanCardId, ClanCardItemId } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { gridTiles, tileAt } from '../material/PlayerGrid'
import { Rules } from '../Rules'

/**
 * What each square of a player's grid shows, read off the locations alone.
 *
 * A card played on a square covers the tile of that square, and covers whatever card was already standing there.
 * What a card covers is off the table for as long as the card is there, and that holds whichever of the 2 it is:
 * a covered card and a covered tile are never activated, never turned over, and never counted, by anything.
 * So a square shows its top card, or its tile when no card was ever played on it, and everything that reads a
 * grid goes through here.
 *
 * Kept apart from what a card or a tile gives (see {@link playedCards} and {@link tileChoices}): the sheets of the
 * clans count what their owner has in play to price their own cards, and reading that off what a card gives would
 * come back around to the cards asking.
 */

/** Every card a player has in play, the covered ones included. */
export const cardsInPlay = (rules: Rules, player: number) => rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(player)

/**
 * The index of the card on top of a square, the only one that counts: cards pile up on a square as they are
 * played, and the one the player sees is the last of them.
 */
export const topCardIndexOn = (rules: Rules, player: number, cell: XYCoordinates): number | undefined => {
  const tiles = tileAt(rules.material(MaterialType.Tile), player, cell).getIndexes()
  if (tiles.length === 0) return undefined
  const cards = cardsInPlay(rules, player).parent(tiles[0]).getIndexes()
  return cards.length === 0 ? undefined : Math.max(...cards)
}

/** Which card that is. Undefined when the square holds none, and undefined too for a card nobody here may read. */
export const topCardOn = (rules: Rules, player: number, cell: XYCoordinates): ClanCardId | undefined => {
  const index = topCardIndexOn(rules, player, cell)
  return index === undefined ? undefined : rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(index).id?.front
}

/**
 * The cards of a player no other card of theirs covers: the top card of each of their squares, and the whole of
 * what they have in play as far as anything counting their cards is concerned.
 */
export const visibleCards = (rules: Rules, player: number) => {
  const cards = cardsInPlay(rules, player)
  const tops = new Set(cards.getItems().map((card) => Math.max(...cards.parent(card.location.parent!).getIndexes())))
  return cards.index((index) => tops.has(index))
}

/**
 * The tiles a card covers. Read off the cards rather than off the tiles: which tile a card covers is the item its
 * location points to, a card being played onto the tile of its square (see {@link LocationType.PlayedCard}).
 */
const coveredTiles = (rules: Rules, player: number): Set<number | undefined> =>
  new Set(
    cardsInPlay(rules, player)
      .getItems()
      .map((card) => card.location.parent)
  )

/**
 * The tiles of a player that no card covers: the only tiles anything reading their grid ever sees, whether it is
 * offering one to turn over or counting the ones already turned (see {@link tileChoices}).
 */
export const bareTiles = (rules: Rules, player: number) => {
  const covered = coveredTiles(rules, player)
  return gridTiles(rules.material(MaterialType.Tile), player).filter((_, index) => !covered.has(index))
}
