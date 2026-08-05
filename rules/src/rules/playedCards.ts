import { XYCoordinates } from '@gamepark/rules-api'
import { Clan } from '../Clan'
import { ClanCardId, ClanCardItemId, clanOf } from '../material/ClanCardId'
import { clanCardEffects } from '../material/clanCards/cardProperties'
import { Effect, EffectSet, hasEffect, isEffectChoice } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { tileAt } from '../material/PlayerGrid'
import { Rules } from '../Rules'
import { isPackActive } from './sharkPack'

/**
 * The clan cards a player has played onto their grid. What one gives is read here rather than off its tile: a card
 * covers the square it sits on, so activating that square resolves the card and not the tile under it.
 */

/** Every card a player has in play, covered ones included. */
const playedCards = (rules: Rules, player: number) => rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(player)

/**
 * The index of the card on top of a square, the only one that counts: cards pile up on a square as they are
 * played, and the one the player sees is the last of them.
 */
export const topCardIndexOn = (rules: Rules, player: number, cell: XYCoordinates): number | undefined => {
  const tiles = tileAt(rules.material(MaterialType.Tile), player, cell).getIndexes()
  if (tiles.length === 0) return undefined
  const cards = playedCards(rules, player).parent(tiles[0]).getIndexes()
  return cards.length === 0 ? undefined : Math.max(...cards)
}

/** Which card that is. Undefined when the square holds none, and undefined too for a card nobody here may read. */
export const topCardOn = (rules: Rules, player: number, cell: XYCoordinates): ClanCardId | undefined => {
  const index = topCardIndexOn(rules, player, cell)
  return index === undefined ? undefined : rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(index).id?.front
}

/**
 * Which of the 2 effects a Cat card is showing: the second one once the card has been turned half a turn, which
 * is what activating it does (see {@link activateCard}). Every other clan reads the same thing every time.
 * The half turn is the rotation of the location, as it is for a tile, and it means the same thing: the face up.
 */
const isRotated = (rules: Rules, player: number, cell: XYCoordinates): boolean => {
  const index = topCardIndexOn(rules, player, cell)
  return index !== undefined && rules.material(MaterialType.ClanCard).getItem(index).location.rotation === true
}

/**
 * How each clan reads the cards it plays, for the clans whose cards do not always give the same thing: the Sharks
 * cover one of the 2 effects of a card with a token, and the Cats will turn a card over as they activate it, which
 * is the same question answered on 2 different things.
 * Every other clan gives what its cards print first, whatever happens around them.
 */
const clanCardReaders: Partial<Record<Clan, (rules: Rules, player: number, cell: XYCoordinates, card: ClanCardId) => EffectSet>> = {
  [Clan.Shark]: (rules, player, cell, card) => clanCardEffects(card, isPackActive(rules, player, cell)),
  [Clan.Cat]: (rules, player, cell, card) => clanCardEffects(card, isRotated(rules, player, cell))
}

/**
 * What activating a square gives: what the card on it gives, or nothing at all when no card covers it, in which
 * case what the tile gives is what counts.
 */
export const cardEffectsOn = (rules: Rules, player: number, cell: XYCoordinates): EffectSet | undefined => {
  const card = topCardOn(rules, player, cell)
  if (card === undefined) return undefined
  const read = clanCardReaders[clanOf(card)]
  return read === undefined ? clanCardEffects(card) : read(rules, player, cell, card)
}

/**
 * The cards an "activate one of your cards in play" effect may pick, which the Panda Queen is the only card of
 * the box to give. The covered cards are left out, exactly as they are when a square is activated.
 *
 * A card that would activate a card is left out too: with 1 Queen per clan that means the Queen herself, and
 * activating her over and over is not something the rulebook ever asks a player to stop doing.
 */
export const activableCards = (rules: Rules, player: number) => {
  const tiles = playedCards(rules, player)
    .getItems()
    .map((card) => card.location.parent!)
  const tops = [...new Set(tiles)].map((tile) => Math.max(...playedCards(rules, player).parent(tile).getIndexes()))
  return rules
    .material(MaterialType.ClanCard)
    .index(tops)
    .id<ClanCardItemId>((id) => id.front !== undefined && isActivableCard(clanCardEffects(id.front)))
}

const isActivableCard = (effects: EffectSet): boolean =>
  hasEffect(effects) && (isEffectChoice(effects) || (effects[Effect.ActivateCard] ?? 0) === 0)
