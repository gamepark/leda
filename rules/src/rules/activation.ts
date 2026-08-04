import { MaterialMove, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { Clan } from '../Clan'
import { ActionZone, actionZoneCells } from '../material/ActionZone'
import { clanOf } from '../material/ClanCardId'
import { isRing } from '../material/clanCards/catCards'
import { hasEffect } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, sameCell, tileAt } from '../material/PlayerGrid'
import { hasTileEffect, isPermanent, tileEffects } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { Rules } from '../Rules'
import { pendingRules, resolveEffects } from './effects'
import { Memory } from './Memory'
import { cardEffectsOn, topCardIndexOn, topCardOn } from './playedCards'
import { RuleId } from './RuleId'

/**
 * What a player may still do while the zone is being activated. The app reads it to know which squares and tiles
 * to offer, and the rules of the phase to know which moves are legal, so that the two can never disagree.
 */

/** The zone of the round: the one the active player picked on the Action tile. */
export const roundZone = (rules: Rules): ActionZone | undefined => rules.game.memory[Memory.ActionZone]

/**
 * Whether the zone is being activated, the rules an effect opens along the way included: a Military Victory token
 * opens the same ones, so those count only when the activation is what they go back to.
 * Read off the rules waiting rather than off a list of such rules, which every clan card would have to be added to.
 */
export const isActivationPhase = (rules: Rules): boolean =>
  rules.game.rule?.id === RuleId.ActivateZone || pendingRules(rules).includes(RuleId.ActivateZone)

/** The squares of the zone a player has already resolved this round. */
const activatedCells = (rules: Rules, player: number): XYCoordinates[] => rules.game.memory[Memory.ActivatedCells]?.[player] ?? []

/**
 * The squares of the zone a player has left to activate in their grid. A square with nothing to resolve is left
 * out rather than skipped by hand: the rulebook has the player activate each square of the zone "if possible",
 * and a Desert is exactly the square that is not possible.
 */
export const activableCells = (rules: Rules, player: number): XYCoordinates[] => {
  const zone = roundZone(rules)
  if (zone === undefined) return []
  const activated = activatedCells(rules, player)
  return actionZoneCells[zone].filter((cell) => !activated.some((done) => sameCell(done, cell)) && isActivable(rules, player, cell))
}

/**
 * Whether a square holds anything to resolve: what the card played on it gives, or what its tile gives when no
 * card covers it. A card covers the tile of its square, so a card whose effects are not written down yet leaves
 * its square with nothing to activate (see {@link cardEffectsOn}).
 */
const isActivable = (rules: Rules, player: number, cell: XYCoordinates): boolean => {
  const card = cardEffectsOn(rules, player, cell)
  if (card !== undefined) return hasEffect(card)
  const tile = tileAt(rules.material(MaterialType.Tile), player, cell).getItem<TileId>()
  return tile !== undefined && hasTileEffect(tile.id, tile.location.rotation === true)
}

/**
 * Everything activating a tile gives, whichever rule asked for it: what the face it shows gives, and the Desert a
 * temporary tile becomes once it has given it. A permanent tile keeps its face and can be activated again.
 * The square is handed to the effects, some of which are read against it (see {@link EffectSource}).
 */
export const activateTile = (rule: PlayerTurnRule<number, MaterialType, LocationType>, index: number): MaterialMove<number, MaterialType, LocationType>[] => {
  const tiles = rule.material(MaterialType.Tile)
  const tile = tiles.getItem<TileId>(index)
  if (tile === undefined) return []
  const flipped = tile.location.rotation === true
  const moves = resolveEffects(rule, tileEffects(tile.id, flipped), { cell: cellOf(tile.location) })
  if (!flipped && !isPermanent(tile.id)) moves.push(tiles.index(index).moveItem({ ...tile.location, rotation: true }))
  return moves
}

/**
 * The squares a Cat card copying the opponent may pick: the squares of the zone of the round that hold a card of
 * that opponent with something to give, whether they have activated it yet or not.
 * A card whose effects are not written down yet is left out, exactly as it is when a square is activated.
 */
export const copiableCells = (rules: Rules, player: number): XYCoordinates[] => {
  const zone = roundZone(rules)
  const opponent = rules.game.players.find((other) => other !== player)
  if (zone === undefined || opponent === undefined) return []
  return actionZoneCells[zone].filter((cell) => {
    const effects = cardEffectsOn(rules, opponent, cell)
    return effects !== undefined && hasEffect(effects)
  })
}

/**
 * The squares a Ring may turn a card over on: the ones whose top card is a Cat card of the player with 2 effects
 * to alternate between. A Ring is left out, printing one effect and no second one.
 */
export const rotatableCells = (rules: Rules, player: number): XYCoordinates[] => {
  const tiles = rules.material(MaterialType.Tile)
  return rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayedCard)
    .player(player)
    .getItems()
    .map((card) => cellOf(tiles.getItem(card.location.parent!).location))
    .filter((cell) => {
      const card = topCardOn(rules, player, cell)
      return card !== undefined && clanOf(card) === Clan.Cat && !isRing(card)
    })
}

/**
 * Everything activating a card gives: what the face it is showing gives, and the half turn a Cat card takes once
 * it has given it, which is what brings its other effect up for the next activation. Every other clan leaves its
 * cards exactly as they were, and gives the same thing every time.
 *
 * Shared by the 2 rules that activate a card, the zone of the round and a card asking for a card
 * (see {@link ActivateCardRule}): a Cat card copied by an opponent is not turned over, since what is activated
 * there is the copy and not the card (see {@link CopyOpponentCardRule}).
 */
export const activateCard = (rule: PlayerTurnRule<number, MaterialType, LocationType>, cell: XYCoordinates): MaterialMove<number, MaterialType, LocationType>[] => {
  const effects = cardEffectsOn(rule, rule.player, cell)
  if (effects === undefined) return []
  return [...resolveEffects(rule, effects, { cell }), ...rotateCatCard(rule, rule.player, cell)]
}

/**
 * The half turn, for a Cat card with 2 effects and for nothing else: the rotation of the location is which of
 * them is up. A Ring is left alone, printing one effect and no second one: turning it would leave it blank, and
 * the Rings are the cards a Cat player is trying to keep on the table.
 */
export const rotateCatCard = (
  rule: PlayerTurnRule<number, MaterialType, LocationType>,
  player: number,
  cell: XYCoordinates
): MaterialMove<number, MaterialType, LocationType>[] => {
  const card = topCardOn(rule, player, cell)
  if (card === undefined || clanOf(card) !== Clan.Cat || isRing(card)) return []
  const index = topCardIndexOn(rule, player, cell)!
  const cards = rule.material(MaterialType.ClanCard)
  const rotated = cards.getItem(index).location.rotation === true
  return [cards.index(index).moveItem((item) => ({ ...item.location, rotation: !rotated }))]
}

/**
 * What follows a player being done with phase 1, their Awakenings resolved: their opponent activates the same zone
 * of their own grid, and once both have, the round moves on to the military conflict.
 * Shared by the two rules a player may be done in, the activation itself and the Awakenings that close it.
 */
export const afterActivation = (rule: PlayerTurnRule<number, MaterialType, LocationType>): MaterialMove<number, MaterialType, LocationType>[] =>
  rule.player === rule.remind<number>(Memory.RoundPlayer)
    ? [rule.startPlayerTurn(RuleId.ActivateZone, rule.nextPlayer)]
    : [rule.startRule(RuleId.MilitaryConflict)]
