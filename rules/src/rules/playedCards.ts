import { XYCoordinates } from '@gamepark/rules-api'
import { ClanCardId, ClanCardItemId } from '../material/ClanCardId'
import { clanCardEffects } from '../material/clanCards/cardProperties'
import { Effect, EffectSet, hasEffect, isEffectChoice } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { tileAt } from '../material/PlayerGrid'
import { Rules } from '../Rules'

/**
 * The clan cards a player has played onto their grid. What one gives is read here rather than off its tile: a card
 * covers the square it sits on, so activating that square resolves the card and not the tile under it.
 */

/** Every card a player has in play, covered ones included. */
const playedCards = (rules: Rules, player: number) => rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(player)

/**
 * The card on top of a square, the only one that counts: cards pile up on a square as they are played, and the
 * one the player sees is the last of them.
 */
export const topCardOn = (rules: Rules, player: number, cell: XYCoordinates): ClanCardId | undefined => {
  const tiles = tileAt(rules.material(MaterialType.Tile), player, cell).getIndexes()
  if (tiles.length === 0) return undefined
  const cards = playedCards(rules, player).parent(tiles[0]).getIndexes()
  return cards.length === 0 ? undefined : rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(Math.max(...cards)).id?.front
}

/** What activating a square gives: what the card on it gives, or what its tile gives when no card covers it. */
export const cardEffectsOn = (rules: Rules, player: number, cell: XYCoordinates): EffectSet | undefined => {
  const card = topCardOn(rules, player, cell)
  return card === undefined ? undefined : clanCardEffects(card)
}

/**
 * The cards an "activate one of your cards in play" effect may pick, which the Panda Queen is the only card to
 * give so far. The covered cards are left out, exactly as they are when a square is activated.
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
