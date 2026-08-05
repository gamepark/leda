import { MaterialRules } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { militaryVictorySymbols, MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { pendingRules } from './effects'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

/** The military symbols a player gathered while activating the zone. Reset when the round starts. */
export const militarySymbols = (rules: Rules, player: number): number => rules.game.memory[Memory.MilitarySymbols]?.[player] ?? 0

/**
 * Who takes the top Military Victory token: the player who gathered the most military symbols.
 * Nobody when the players are tied, 0 to 0 included, in which case the conflict has no winner and nothing happens.
 */
export const conflictWinner = (rules: Rules): number | undefined => {
  const players = rules.game.players
  const most = Math.max(...players.map((player) => militarySymbols(rules, player)))
  const winners = players.filter((player) => militarySymbols(rules, player) === most)
  return winners.length === 1 ? winners[0] : undefined
}

/**
 * By how many military symbols a player is ahead: what they gathered less what the best of the others did, and a
 * negative number for a player who is behind. A lead of 1 or more is what wins the conflict.
 * Only worth reading once both players are done activating, which is the conflict itself: the active player of the
 * round activates first, so their lead over an opponent who has not played yet is a lead over nothing.
 * The Red Ring of the Cats is the only card that asks for it, and asks for a conflict won by 3 symbols or more.
 */
export const militaryLead = (rules: Rules, player: number): number => {
  const others = rules.game.players.filter((other) => other !== player)
  return militarySymbols(rules, player) - Math.max(0, ...others.map((other) => militarySymbols(rules, other)))
}

/**
 * Whether the conflict of the round is being settled, the rules an effect opens along the way included: the token
 * that was won may ask the player something, and the organisation waits behind all of it.
 * Read off the rules waiting rather than off a list of such rules, exactly as the activation is
 * (see {@link isActivationPhase}): a Military Victory token a card draws in the middle of an activation is not the
 * conflict of the round, and has the activation waiting behind it instead.
 */
export const isMilitaryConflictPhase = (rules: Rules): boolean =>
  rules.game.rule?.id === RuleId.MilitaryConflict || pendingRules(rules).includes(RuleId.StartOrganisation)

/** The Military Victory tokens a player has won, which some cards read and some let them trade. */
export const ownedMilitaryVictoryTokens = (rules: Rules, player: number) =>
  rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(player)

/**
 * The Victory symbols a player controls: what the tokens they won during the conflicts are worth, added up.
 * Unlike the military symbols above, they are never lost, and they are what decides who opens a new cycle of
 * rounds (see {@link EndOfRoundRule}).
 */
export const victorySymbols = (rules: Rules, player: number): number =>
  rules
    .material(MaterialType.MilitaryVictoryToken)
    .location(LocationType.PlayerMilitaryVictory)
    .player(player)
    .getItems<MilitaryVictoryTokenId>()
    .reduce((symbols, token) => symbols + militaryVictorySymbols(token.id!), 0)
