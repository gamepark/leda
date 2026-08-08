import { MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { Clan } from '../Clan'
import { ClanCardId, ClanCardItemId, clanOf } from '../material/ClanCardId'
import { clanCardEffects } from '../material/clanCards/cardProperties'
import { Effect, EffectItem, EffectSet, hasEffect, hasHalfTurn, isEffectChoice } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Rules } from '../Rules'
import { isPackActive } from './sharkPack'
import { topCardIndexOn, topCardOn, visibleCards } from './squares'

/**
 * What the clan cards a player has played onto their grid give. Which card a square holds is read off the squares
 * (see {@link squares}), and what it gives is read here rather than off its tile: a card covers the square it sits
 * on, so activating that square resolves the card and not the tile under it.
 */

/**
 * Which of the 2 effects a Cat card is showing: the second one once the card has been turned half a turn, which
 * is what activating it gives (see {@link Effect.HalfTurn}). Every other clan reads the same thing every time.
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
 * The half turn a card takes, the one move there is to it: the rotation of the location is which of its 2 effects
 * is up, and turning the card is flipping that.
 *
 * Only a card that has 2 effects to alternate between ever takes it, which is asked of the card rather than of
 * whoever is turning it: a Ring prints one effect and no second one, and a card of a clan that alternates nothing
 * would be turned onto a face it does not have. Nothing happens to either, exactly as nothing happens to a card
 * told to become a Desert (see {@link becomesDesert}). Neither does anything happen to a tile handed here: what a
 * half turn reaches is whatever gave it, and only a card has a second face (see {@link Effect.HalfTurn}).
 */
export const rotateCard = (rules: Rules, { type, index }: EffectItem): MaterialMove<number, MaterialType, LocationType>[] => {
  if (type !== MaterialType.ClanCard) return []
  const cards = rules.material(MaterialType.ClanCard)
  const card = cards.getItem<ClanCardItemId>(index)
  const rotated = card?.location.rotation === true
  if (card?.id?.front === undefined || !hasHalfTurn(clanCardEffects(card.id.front, rotated))) return []
  return [cards.index(index).moveItem((item) => ({ ...item.location, rotation: !rotated }))]
}

/**
 * The same half turn, taken by the card standing on a square: what a Ring asks for, the player naming a square of
 * their grid rather than a card (see {@link RotateCatCardRule}). A bare square holds no card to turn.
 */
export const rotateCardOn = (rules: Rules, player: number, cell: XYCoordinates): MaterialMove<number, MaterialType, LocationType>[] => {
  const index = topCardIndexOn(rules, player, cell)
  return index === undefined ? [] : rotateCard(rules, { type: MaterialType.ClanCard, index })
}

/**
 * The cards an "activate one of your cards in play" effect may pick, which the Panda Queen is the only card of
 * the box to give. The covered cards are left out, exactly as they are when a square is activated.
 *
 * A card that would activate a card is left out too: with 1 Queen per clan that means the Queen herself, and
 * activating her over and over is not something the rulebook ever asks a player to stop doing.
 */
export const activableCards = (rules: Rules, player: number) =>
  visibleCards(rules, player).id<ClanCardItemId>((id) => id.front !== undefined && isActivableCard(clanCardEffects(id.front)))

const isActivableCard = (effects: EffectSet): boolean =>
  hasEffect(effects) && (isEffectChoice(effects) || (effects[Effect.ActivateCard] ?? 0) === 0)
