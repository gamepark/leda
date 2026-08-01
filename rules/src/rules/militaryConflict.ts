import { MaterialRules } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { militaryVictorySymbols, MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { Memory } from './Memory'

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
