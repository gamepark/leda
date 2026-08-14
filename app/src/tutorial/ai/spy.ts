import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { actionTileZones } from '@gamepark/leda/material/ActionZone'
import { Effect } from '@gamepark/leda/material/Effect'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { militaryVictoryEffects, militaryVictorySymbols, MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { activableCells } from '@gamepark/leda/rules/activation'
import { roundsPerCycle } from '@gamepark/leda/rules/EndOfRoundRule'
import { Memory } from '@gamepark/leda/rules/Memory'
import { militarySymbols } from '@gamepark/leda/rules/militaryConflict'
import { spiedItem } from '@gamepark/leda/rules/spy'
import { isMoveItem, isMoveItemType, MaterialMove } from '@gamepark/rules-api'
import { Ai, bestOf, effectsGain, gainValue } from './AiPlayer'
import { bestPlacement } from './cards'
import { expectedOpponentSymbols, militaryFromCells, zoneAdvantage } from './grid'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * A Spy effect, which the rulebook makes 2 moves of: taking the first item of a pile, then putting it back on top
 * of that pile or under it.
 *
 * The look is where a bot most easily reads as a machine, so this is written the way a player would talk their own
 * look through: which pile is worth opening at all, and then, having seen what is on it, whether the round to come
 * is better off with that item where it was or with whatever is behind it.
 *
 * The AI reads the item it took, and nothing else of any pile: that is the whole of the effect, and it is the one
 * thing the rules hand it that its opponent does not get to see (see {@link SpyRule}).
 */

/** Which of the 2 moves of the effect the AI is being asked for: an item is out of its pile, or none is yet. */
export const isPuttingSpiedItemBack = (ai: Ai): boolean => spiedItem(ai.rules) !== undefined

/**
 * Which pile to look into.
 *
 * Nothing of any pile is read here, and nothing could be: the AI is choosing what to find out, not what it found.
 * So the piles are ranked on what a look into them is worth this round, which is a different thing for each: the
 * deck of the player matters as much as drawing does to their clan, the Military Victory tokens matter for as long
 * as one can still be won, and the Action tiles matter until the end of a cycle shuffles them back anyway.
 */
export const chooseSpiedPile = (ai: Ai, moves: Move[]): Move | undefined =>
  bestOf(moves.map((move) => ({ move, score: pileInterest(ai, move) })))

const pileInterest = (ai: Ai, move: Move): number => {
  if (isMoveItemType(MaterialType.ClanCard)(move)) return 0.8 + 0.5 * ai.weights[Effect.Draw]
  if (isMoveItemType(MaterialType.MilitaryVictoryToken)(move)) return ai.conflictValue > 0 ? 1.6 : 0.4
  // The tile of the round to come, which the end of a cycle shuffles back before anyone can use what was seen.
  return cycleEnds(ai) ? 0.2 : 1
}

/** Whether the round being played is the last of its cycle, after which the 5 Action tiles are shuffled back. */
const cycleEnds = (ai: Ai): boolean =>
  ai.rules.material(MaterialType.ActionTile).location(LocationType.ActionTileRevealed).length >= roundsPerCycle

/**
 * Where to put the item back, now that the AI has seen it: on top of its pile, where it is the next thing to come
 * out of it, or under it, where nobody will see it for a long while.
 *
 * One question for the 3 piles: is the next thing out of this pile better off being this one? What differs is who
 * that next thing goes to, which for the tokens and the Action tiles is not always the player looking.
 */
export const putSpiedItemBack = (ai: Ai, moves: Move[]): Move | undefined => {
  const onTop = moves.find((move) => isMoveItem(move) && move.location.x !== 0)
  const under = moves.find((move) => isMoveItem(move) && move.location.x === 0)
  if (onTop === undefined || under === undefined) return moves[0]
  return keepOnTop(ai, onTop) ? onTop : under
}

const keepOnTop = (ai: Ai, move: Move): boolean => {
  if (isMoveItemType(MaterialType.ClanCard)(move)) return keepCardOnTop(ai, move.itemIndex)
  if (isMoveItemType(MaterialType.MilitaryVictoryToken)(move)) return keepTokenOnTop(ai, move.itemIndex)
  if (isMoveItemType(MaterialType.ActionTile)(move)) return keepActionTileOnTop(ai, move.itemIndex)
  return true
}

/**
 * The top of the AI's own deck, which nobody else ever draws from: there is no one to deny the card to, so the
 * whole of the decision is whether the next draw is better spent on this card or on an unknown one. Hence the
 * comparison with the hand it already holds, which is what an unknown card is expected to be worth.
 */
const keepCardOnTop = (ai: Ai, index: number): boolean => {
  const value = bestPlacement(ai, index)?.value ?? 0
  const hand = ai.rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayerHand)
    .player(ai.player)
    .getIndexes()
    .map((card) => bestPlacement(ai, card)?.value ?? 0)
  if (hand.length === 0) return value > 0
  return value >= hand.reduce((sum, card) => sum + card, 0) / hand.length
}

/**
 * The top of the pile of Military Victory tokens, which is the one pile whose next item may well go to the
 * opponent: it is drawn by whoever wins the conflict, and by this point in the round the AI knows whether that is
 * going to be itself (see {@link expectMyToken}).
 * So a good token is kept on top when the AI is winning the round and buried when it is losing it, which is one
 * decision made from either end.
 */
const keepTokenOnTop = (ai: Ai, index: number): boolean => {
  const token = ai.rules.material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(index)
  if (token?.id === undefined) return true
  return expectMyToken(ai) === tokenValue(ai, token.id) >= averageTokenValue(ai)
}

/** What a Military Victory token is worth: the Victory symbols it prints, and whatever else it gives. */
export const tokenValue = (ai: Ai, token: MilitaryVictoryTokenId): number =>
  militaryVictorySymbols(token) * symbolValue(ai) + gainValue(ai, effectsGain(ai, militaryVictoryEffects[token] ?? {}))

/**
 * What one Victory symbol is worth, which is a share of the game: the conflict value goes to 0 while a Scorpion
 * Portal keeps the round closed to tokens, and a token in front of a player is worth its symbols all the same.
 */
const symbolValue = (ai: Ai): number => Math.max(ai.conflictValue, 2.5)

/**
 * What an unknown token is worth, which is what the one in hand is compared against: the 18 tokens of the pile are
 * worth 20 Victory symbols between them, and 6 of the 8 kinds give something on top of theirs.
 */
const averageTokenValue = (ai: Ai): number => symbolValue(ai) * (20 / 18) + 0.85

/**
 * Whether the AI expects the conflict of the round to be its own: what it can still gather off its side of the
 * zone, against what the opponent can gather off theirs. A tie is nobody's, so the lead has to be strict.
 */
export const expectMyToken = (ai: Ai): boolean =>
  militarySymbols(ai.rules, ai.player) + militaryFromCells(ai.rules, ai.player, activableCells(ai.rules, ai.player)) >
  expectedOpponentSymbols(ai.rules, ai.player)

/**
 * The top of the pile of Action tiles, which is the tile of the round to come. Whoever did not open this round
 * opens the next one, and the zone is theirs to pick off that tile, so a tile that suits the AI is kept where it
 * is only when the AI is the one who will be picking.
 * Worth nothing at the end of a cycle: the 5 tiles are shuffled back before another one is revealed.
 */
const keepActionTileOnTop = (ai: Ai, index: number): boolean => {
  if (cycleEnds(ai)) return true
  const tile = ai.rules.material(MaterialType.ActionTile).getItem<ActionTileId>(index)
  if (tile?.id === undefined) return true
  const zones = actionTileZones[tile.id].map((zone) => zoneAdvantage(ai, zone))
  const opensNextRound = ai.rules.game.memory[Memory.RoundPlayer] !== ai.player
  // The player picking takes the zone that suits them best, which is the worst of these when it is not the AI.
  return (opensNextRound ? Math.max(...zones) : Math.min(...zones)) > 0
}
