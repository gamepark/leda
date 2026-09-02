import { MaterialItem, MaterialMove, MaterialRulesPart, PlayerTurnRule, XYCoordinates } from '@gamepark/rules-api'
import { ActionZone, actionZoneCells } from '../material/ActionZone'
import { EffectItem, EffectSet, hasEffect, hasHalfTurn } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, sameCell, tileAt } from '../material/PlayerGrid'
import { isPermanent, tileEffects } from '../material/TileEffect'
import { TileId } from '../material/TileId'
import { Rules } from '../Rules'
import { pendingRules, resolveEffects } from './effects'
import { Memory } from './Memory'
import { cardEffectsOn } from './playedCards'
import { RoundPhase, roundPhase } from './roundPhase'
import { RuleId } from './RuleId'
import { topCardIndexOn, visibleCards } from './squares'
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

/** The squares of the zone a player has already resolved this round. */
const activatedCells = (rules: Rules, player: number): XYCoordinates[] => rules.game.memory[Memory.ActivatedCells]?.[player] ?? []

/**
 * Nothing is activated twice during one activation phase, which the FAQ of the game answers and the rulebook
 * leaves out: a tile or a clan card gives what it gives once a round, whichever effect asks for it.
 *
 * Written down as the items themselves, and read back through the square they stand on right now
 * (see {@link Memory.ActivatedItems}): the 4 squares of the zone are barred by their coordinates already
 * (see {@link activatedCells}), and coordinates are exactly what a Scorpion Portal makes unreliable by swapping 2
 * squares in the middle of the phase. The 2 lists therefore say different things and both are needed: a square is
 * activated once, and so is what stands on it, wherever a swap has left it.
 */

/** Everything already activated this round, whichever rule activated it. */
const activatedItems = (rules: Rules): EffectItem[] => rules.game.memory[Memory.ActivatedItems] ?? []

/** Whether this very tile or this very card has already given what it gives this round. */
export const isItemActivated = (rules: Rules, { type, index }: EffectItem): boolean =>
  activatedItems(rules).some((activated) => activated.type === type && activated.index === index)

/**
 * One more item activated. Called from the 2 places anything is ever activated from, so that no rule can activate
 * something without it being written down (see {@link activateTile} and {@link activateCard}), plus the Desert a
 * Scorpion card reads the reminder of, which activates a tile without going through either
 * (see {@link ActivateDesertRule}).
 *
 * Nothing is written twice: an item is barred from being activated again, so it never reaches this twice, and the
 * guard is there for the rule that would be added without reading this.
 */
export const rememberActivated = (rule: MaterialRulesPart<number, MaterialType, LocationType>, item: EffectItem) => {
  if (isItemActivated(rule, item)) return
  rule.memorize<EffectItem[]>(Memory.ActivatedItems, (items: EffectItem[] = []) => [...items, item])
}

/**
 * What a square holds right now, which is what activating it activates: the card no other covers, or the tile of
 * the square when no card was ever played on it (see {@link squares}).
 * The same reading {@link squareEffects} makes to know what a square gives, told as the item rather than as what
 * it gives, since it is the item that is barred from giving twice.
 */
export const squareItem = (rules: Rules, player: number, cell: XYCoordinates): EffectItem | undefined => {
  const card = topCardIndexOn(rules, player, cell)
  if (card !== undefined) return { type: MaterialType.ClanCard, index: card }
  const [tile] = tileAt(rules.material(MaterialType.Tile), player, cell).getIndexes()
  return tile === undefined ? undefined : { type: MaterialType.Tile, index: tile }
}

/** Whether what a square holds has already been activated this round, and is therefore closed for the phase. */
export const isSquareActivated = (rules: Rules, player: number, cell: XYCoordinates): boolean => {
  const item = squareItem(rules, player, cell)
  return item !== undefined && isItemActivated(rules, item)
}

/**
 * The squares of a list that are still open, which every rule that offers squares to activate narrows its own
 * list down through: the zone of the round, a tile, a Desert or a card in play. One filter for all of them, so
 * that no rule can be the one that forgot it (see {@link lockedCells}).
 */
export const stillActivable = (rules: Rules, player: number, cells: XYCoordinates[]): XYCoordinates[] =>
  cells.filter((cell) => !isSquareActivated(rules, player, cell))

/**
 * A rule asking a player which square of their own grid they activate, whichever of the 5 it is: the zone of the
 * round, a tile, a Desert, a card in play, or the tile a Scorpion card upgrades before activating it.
 *
 * `candidateCells` is what it would offer if nothing had been activated yet, and `cells` what it does offer, the
 * one being the other narrowed down by {@link stillActivable}. Both are read off the rule itself rather than
 * worked out a second time beside it: the table shows a lock exactly where a square is missing from the second
 * and present in the first, so the answer has to come from the very rule that left it out
 * (see {@link lockedCells}).
 */
export type ActivationChoice = { player: number; candidateCells: XYCoordinates[] }

/** All {@link lockedCells} needs of the rules: the game, the grids, and the rule waiting. */
type SteppedRules = Rules & { readonly rulesStep?: MaterialRulesPart<number, MaterialType, LocationType> }

/** The rule waiting, when it is one that asks for a square, which it says by carrying the squares it would offer. */
const activationChoice = (rules: SteppedRules): ActivationChoice | undefined => {
  const step = rules.rulesStep as Partial<ActivationChoice> | undefined
  return Array.isArray(step?.candidateCells) && typeof step.player === 'number' ? (step as ActivationChoice) : undefined
}

/**
 * The squares the rule waiting would be offering if nothing had been activated yet, and is not: what the table
 * marks with a lock, on the tile of the square and on the card laid over it alike
 * (see {@link ActivationLockButton}).
 *
 * Only those, and not every square already activated: a lock answers a question the player is asking right now,
 * which is why the square they were aiming at is not being offered. A square that no rule would offer anyway,
 * a Desert while a card asks for a tile, has nothing to answer for and carries nothing.
 *
 * The tile a Scorpion card upgrades before activating it is the one square that carries both a lock and a button:
 * the upgrade is still offered, and the lock says the activation behind it is not
 * (see {@link UpgradeAndActivateTileRule}).
 *
 * Of the activation phase alone, the special activations of the clans included: the list is emptied when the next
 * round starts, and what it says of a round that has moved on to its conflict is no longer anybody's business
 * (see {@link roundPhase}).
 */
export const lockedCells = (rules: SteppedRules, player: number): XYCoordinates[] => {
  if (roundPhase(rules) !== RoundPhase.Activation) return []
  const choice = activationChoice(rules)
  if (choice === undefined || choice.player !== player) return []
  return choice.candidateCells.filter((cell) => isSquareActivated(rules, player, cell))
}

/**
 * The squares of the zone a player has left to activate in their grid. A square with nothing to resolve is left
 * out rather than skipped by hand: the rulebook has the player activate each square of the zone "if possible",
 * and a Desert is exactly the square that is not possible.
 *
 * A square holding something already activated is left out the same way, and is exactly as impossible: a swap
 * made in the middle of the phase is what carries such a thing onto a square nobody has been through yet
 * (see {@link stillActivable}).
 */
export const activableCells = (rules: Rules, player: number): XYCoordinates[] => stillActivable(rules, player, zoneCandidateCells(rules, player))

/**
 * The same list before the once-per-phase rule narrows it: the squares of the zone this player has not been
 * through and that hold something to resolve (see {@link ActivationChoice}).
 * A square they have already been through is not a candidate at all, whatever stands on it now: it is done for
 * the round, so nothing about it is left for a lock to explain.
 */
export const zoneCandidateCells = (rules: Rules, player: number): XYCoordinates[] => {
  const zone = roundZone(rules)
  if (zone === undefined) return []
  const activated = activatedCells(rules, player)
  return actionZoneCells[zone].filter((cell) => !activated.some((done) => sameCell(done, cell)) && isActivable(rules, player, cell))
}

/**
 * Whether a square of the grid of a player is one they still have to activate: what the app shines for as long as
 * the phase lasts, on the tile of the square and on everything laid over it alike.
 *
 * Read per player and not per zone: a square already resolved, and a square holding nothing to resolve, are done
 * with for the round and stop shining on the spot, so that what shines is always what is still going to be
 * activated (see {@link activableCells}). Each grid therefore empties as its owner goes through it, and the grid
 * of a player who is done stops shining while their opponent goes through theirs.
 *
 * Except while a player is being asked to swap 2 of their squares, which a Scorpion Portal asks in the middle of
 * that very activation (see {@link swappingPlayer}): the zone stops shining, in both grids, so that the only thing
 * left shining is what may be dragged. What is being asked then is not about the zone, and a table saying
 * otherwise would point at the 4 squares of it while all 16 may be moved.
 */
export const isCellLeftToActivate = (rules: Rules, player: number, cell: XYCoordinates): boolean => {
  if (!isActivationPhase(rules) || swappingPlayer(rules) !== undefined) return false
  return activableCells(rules, player).some((activable) => sameCell(activable, cell))
}

/**
 * What a square holds to resolve: what the card played on it gives, or what its tile gives when no card covers it.
 * A card covers the tile of its square, so a card showing a face that prints nothing leaves its square with
 * nothing to activate, the tile under it staying out of reach (see {@link cardEffectsOn}).
 */
export const squareEffects = (rules: Rules, player: number, cell: XYCoordinates): EffectSet | undefined => {
  const card = cardEffectsOn(rules, player, cell)
  if (card !== undefined) return card
  const tile = tileAt(rules.material(MaterialType.Tile), player, cell).getItem<TileId>()
  return tile === undefined ? undefined : tileEffects(tile.id, tile.location.rotation === true)
}

/** Whether a square holds anything to resolve at all, which is what makes it worth activating. */
const isActivable = (rules: Rules, player: number, cell: XYCoordinates): boolean => {
  const effects = squareEffects(rules, player, cell)
  return effects !== undefined && hasEffect(effects)
}

/**
 * Whether activating an item turns it into a Desert, which only a temporary tile still showing its front ever
 * does: a permanent tile keeps its face however often it is activated, a tile already turned over is a Desert
 * already, and a card has no Desert face at all.
 * Asked of the item being activated rather than assumed of the rule asking, so that becoming a Desert can never
 * happen to something that has no such face.
 */
const becomesDesert = (item: MaterialItem<number, LocationType, TileId>): boolean => item.location.rotation !== true && !isPermanent(item.id)

/**
 * Everything activating a tile gives, whichever rule asked for it: what the face it shows gives, and the Desert a
 * temporary tile becomes once it has given it (see {@link becomesDesert}).
 * The tile is handed to the effects, some of which are read against what gives them (see {@link EffectSource}).
 *
 * Nothing at all for a tile that has already given this phase, and the same goes for a card
 * (see {@link activateCard}): this and that are the 2 doors everything in the game is activated through, so the
 * once-per-phase rule is closed here rather than in each of the rules that knock. Those narrow what they offer
 * down to what is still open (see {@link stillActivable}), and would leave a hole here every time one more is
 * written. One of them means to knock on a closed door: a Scorpion card upgrades a tile "then activates it if
 * possible", and a tile that has given is exactly the tile it is no longer possible to activate
 * (see {@link UpgradeAndActivateTileRule}).
 */
export const activateTile = (rule: PlayerTurnRule<number, MaterialType, LocationType>, index: number): MaterialMove<number, MaterialType, LocationType>[] => {
  const tiles = rule.material(MaterialType.Tile)
  const tile = tiles.getItem<TileId>(index)
  if (tile === undefined || isItemActivated(rule, { type: MaterialType.Tile, index })) return []
  rememberActivated(rule, { type: MaterialType.Tile, index })
  const moves = resolveEffects(rule, tileEffects(tile.id, tile.location.rotation === true), { item: { type: MaterialType.Tile, index } })
  if (becomesDesert(tile)) moves.push(tiles.index(index).moveItem({ ...tile.location, rotation: true }))
  return moves
}

/**
 * The squares a Cat card copying the opponent may pick: the squares of the zone of the round that hold something
 * of that opponent to give, whether they have activated it yet or not. A card of theirs, or the tile of a bare
 * square: the card names a square, and a square is a card over a tile.
 * A square with nothing to give is left out, exactly as it is when its owner activates the zone: what may be
 * copied is what they could activate, which is the same question asked on their grid (see {@link isActivable}).
 *
 * The one reading of a grid the once-per-phase rule does not narrow (see {@link stillActivable}): what is
 * activated here is the card that copies, on this side of the table, and the card read across it is not activated
 * at all. Its owner activating it themselves, before or after, is their own single activation of it.
 */
export const copiableCells = (rules: Rules, player: number): XYCoordinates[] => {
  const zone = roundZone(rules)
  const opponent = rules.game.players.find((other) => other !== player)
  if (zone === undefined || opponent === undefined) return []
  return actionZoneCells[zone].filter((cell) => isActivable(rules, opponent, cell))
}

/**
 * The squares a Ring may turn a card over on: the ones whose card takes a half turn when it is activated, which
 * is to say the ones with 2 effects to alternate between (see {@link Effect.HalfTurn}).
 * The Rings are left out by that alone, giving no such turn: they print one effect and no second one.
 * Read off the cards their owner can see, a card under another one being no more turned over than activated.
 */
export const rotatableCells = (rules: Rules, player: number): XYCoordinates[] => {
  const tiles = rules.material(MaterialType.Tile)
  return visibleCards(rules, player)
    .getItems()
    .map((card) => cellOf(tiles.getItem(card.location.parent!).location))
    .filter((cell) => hasHalfTurn(cardEffectsOn(rules, player, cell)))
}

/**
 * Everything activating a card gives: what the face it is showing gives, the half turn a Cat card takes included,
 * which that card gives like anything else it gives (see {@link Effect.HalfTurn}).
 *
 * Shared by the 2 rules that activate a card, the zone of the round and a card asking for a card
 * (see {@link ActivateCardRule}). A card copied by an opponent goes through neither: what is resolved there is
 * the copy, on the card that copied it, and the card read stays exactly as it stands
 * (see {@link CopyOpponentCardRule}).
 */
export const activateCard = (rule: PlayerTurnRule<number, MaterialType, LocationType>, cell: XYCoordinates): MaterialMove<number, MaterialType, LocationType>[] => {
  const effects = cardEffectsOn(rule, rule.player, cell)
  const index = topCardIndexOn(rule, rule.player, cell)
  if (effects === undefined || index === undefined) return []
  // Nothing, half turn included, for a card that has already given this phase (see {@link activateTile}).
  if (isItemActivated(rule, { type: MaterialType.ClanCard, index })) return []
  rememberActivated(rule, { type: MaterialType.ClanCard, index })
  // The card itself is handed to the effects, and not the square it is being activated on: what it still owes once
  // it has asked its owner something is owed by the card, wherever it stands by then (see {@link EffectSource}).
  return resolveEffects(rule, effects, { item: { type: MaterialType.ClanCard, index } })
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
