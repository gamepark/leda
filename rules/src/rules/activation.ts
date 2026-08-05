import { MaterialMove, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { ActionZone, actionZoneCells, zoneContains } from '../material/ActionZone'
import { hasEffect, hasHalfTurn } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, sameCell, tileAt } from '../material/PlayerGrid'
import { hasTileEffect, isPermanent, tileEffects } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { Rules } from '../Rules'
import { pendingRules, resolveEffects } from './effects'
import { Memory } from './Memory'
import { cardEffectsOn } from './playedCards'
import { RuleId } from './RuleId'
import { swappingPlayer } from './swap'

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

/**
 * Whether a square belongs to the zone being activated, in the grid of either player: what the app shines for as
 * long as the phase lasts, on the tile of the square and on everything laid over it alike.
 *
 * Except while a player is being asked to swap 2 of their squares, which a Scorpion Portal asks in the middle of
 * that very activation (see {@link swappingPlayer}): the zone stops shining, in both grids, so that the only thing
 * left shining is what may be dragged. What is being asked then is not about the zone, and a table saying
 * otherwise would point at the 4 squares of it while all 16 may be moved.
 */
export const isCellOfActivatedZone = (rules: Rules, cell: XYCoordinates): boolean => {
  if (!isActivationPhase(rules) || swappingPlayer(rules) !== undefined) return false
  const zone = roundZone(rules)
  return zone !== undefined && zoneContains(zone, cell)
}

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
 * card covers it. A card covers the tile of its square, so a card showing a face that prints nothing leaves its
 * square with nothing to activate (see {@link cardEffectsOn}).
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
 * A card showing a face that prints nothing is left out, exactly as it is when a square is activated: what may be
 * copied is what its owner could activate, which is the same question asked on their grid.
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
 * The squares a Ring may turn a card over on: the ones whose card takes a half turn when it is activated, which
 * is to say the ones with 2 effects to alternate between (see {@link Effect.HalfTurn}).
 * The Rings are left out by that alone, giving no such turn: they print one effect and no second one.
 */
export const rotatableCells = (rules: Rules, player: number): XYCoordinates[] => {
  const tiles = rules.material(MaterialType.Tile)
  return rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayedCard)
    .player(player)
    .getItems()
    .map((card) => cellOf(tiles.getItem(card.location.parent!).location))
    .filter((cell) => hasHalfTurn(cardEffectsOn(rules, player, cell)))
}

/**
 * Everything activating a card gives: what the face it is showing gives, the half turn a Cat card takes included,
 * which that card gives like anything else it gives (see {@link Effect.HalfTurn}).
 *
 * Shared by the 2 rules that activate a card, the zone of the round and a card asking for a card
 * (see {@link ActivateCardRule}): a Cat card copied by an opponent is not turned over, since what is activated
 * there is the copy and not the card (see {@link CopyOpponentCardRule}).
 */
export const activateCard = (rule: PlayerTurnRule<number, MaterialType, LocationType>, cell: XYCoordinates): MaterialMove<number, MaterialType, LocationType>[] => {
  const effects = cardEffectsOn(rule, rule.player, cell)
  return effects === undefined ? [] : resolveEffects(rule, effects, { cell })
}

/**
 * What follows a player being done with phase 1, whatever their clan closed it with: their opponent activates the
 * same zone of their own grid, and once both have, the round moves on to the military conflict.
 * Shared by the rules a player may be done in: the activation itself, the Awakenings of the Pandas, and the Rings
 * of the Cats (see {@link AwakeningRule} and {@link PlaceRingRule}).
 */
export const afterActivation = (rule: PlayerTurnRule<number, MaterialType, LocationType>): MaterialMove<number, MaterialType, LocationType>[] =>
  rule.player === rule.remind<number>(Memory.RoundPlayer)
    ? [rule.startPlayerTurn(RuleId.ActivateZone, rule.nextPlayer)]
    : [rule.startRule(RuleId.MilitaryConflict)]
