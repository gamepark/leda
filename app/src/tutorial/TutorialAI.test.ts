import { Clan, playableClans } from '@gamepark/leda/Clan'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LedaSetup } from '@gamepark/leda/LedaSetup'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { hasMilitaryVictory, hasSpecialVictory, specialVictoryProgress } from '@gamepark/leda/rules/victory'
import { isCustomMoveType, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { ai } from './TutorialAI'

type Move = MaterialMove<number, MaterialType, LocationType>

/** A move and everything it owes, played straight into the state, which is what a server does with it. */
const playAll = (rules: LedaRules, move: Move) => {
  const randomized = JSON.parse(JSON.stringify(rules.randomize(move)))
  for (const consequence of rules.play(randomized)) playAll(rules, consequence)
}

/** How a game ended, so that a run the AI found a way of playing forever is told from one it finished. */
type Outcome = { winner?: number; moves: number; cards: number[]; progress: number }

/**
 * A whole game of the AI against itself, the 2 clans handed to it rather than picked: what is being tested is how
 * the AI plays each of the 4, and left to itself it draws lots (see {@link chooseClan}).
 *
 * The cap on the moves is a safety net and nothing else: a game that reaches it is a game the AI has found a way
 * of playing forever, which is exactly what this is here to catch.
 */
const playGame = async (clans: [Clan, Clan], cap = 3000): Promise<Outcome> => {
  const rules = new LedaRules(new LedaSetup().setup({ players: 2 }))
  let moves = 0
  while (!rules.isOver() && moves < cap) {
    const player = rules.game.players.find((player) => rules.isTurnToPlay(player))
    if (player === undefined) break
    const legal = rules.getLegalMoves(player)
    const chosen = rules.game.rule?.id === RuleId.ChooseClan ? [clanMove(legal, clans[rules.game.players.indexOf(player)])] : await ai(rules.game, player)
    expect(chosen.length, `player ${player} returned no move on rule ${RuleId[rules.game.rule!.id]}`).toBeGreaterThan(0)
    for (const move of chosen) {
      expect(legal.some((option) => JSON.stringify(option) === JSON.stringify(move)), `illegal move on rule ${RuleId[rules.game.rule!.id]}`).toBe(true)
      playAll(rules, move)
      moves++
    }
  }
  return {
    winner: rules.game.players.find((player) => hasMilitaryVictory(rules, player) || hasSpecialVictory(rules, player)),
    moves,
    cards: rules.game.players.map((player) => rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(player).length),
    progress: rules.game.players.reduce((sum, player) => sum + (specialVictoryProgress(rules, player)?.count ?? 0), 0)
  }
}

const clanMove = (moves: Move[], clan: Clan): Move => {
  const move = moves.find((move) => isCustomMoveType<CustomMoveType, Clan>(CustomMoveType.ChooseClan)(move) && move.data === clan)
  expect(move, `${Clan[clan]} was not offered`).toBeDefined()
  return move!
}

/** The 6 pairings of the box, which is every clan of it against every other one. */
const matchups = playableClans.flatMap((clan, index) => playableClans.slice(index + 1).map((other): [Clan, Clan] => [clan, other]))

describe('The AI', () => {
  it('plays every clan against every other one and finishes the game', async () => {
    const outcomes: Outcome[] = []
    for (const matchup of matchups) outcomes.push(await playGame(matchup))

    for (const [index, outcome] of outcomes.entries()) {
      const matchup = matchups[index].map((clan) => Clan[clan]).join(' vs ')
      expect(outcome.winner, `${matchup} ended with no winner after ${outcome.moves} moves`).toBeDefined()
      // A grid that stays bare is an AI that never found a card worth playing, which is a losing game of LEDA and
      // an unreadable one to watch (see {@link organise}).
      expect(outcome.cards.reduce((sum, cards) => sum + cards, 0), `no card was played in ${matchup}`).toBeGreaterThan(2)
    }

    // Both victories are real paths: a run in which no clan ever gets anywhere near its own is a run in which the
    // AI is only ever fighting over the Military Victory tokens.
    expect(outcomes.reduce((sum, outcome) => sum + outcome.progress, 0)).toBeGreaterThan(matchups.length)
  }, 600000)

  it('leaves nothing of the game state broken behind it', async () => {
    const rules = new LedaRules(new LedaSetup().setup({ players: 2 }))
    let moves = 0
    while (!rules.isOver() && moves < 1500) {
      const player = rules.game.players.find((player) => rules.isTurnToPlay(player))
      if (player === undefined) break
      for (const move of await ai(rules.game, player)) {
        playAll(rules, move)
        moves++
      }
      // A grid always holds its 16 tiles, one per square, whatever a swap left in the middle of itself.
      for (const player of rules.game.players) {
        const cells = rules
          .material(MaterialType.Tile)
          .location(LocationType.PlayerGrid)
          .player(player)
          .getItems()
          .map(({ location }) => `${location.x},${location.y}`)
        expect(cells.length).toBe(16)
        expect(new Set(cells).size).toBe(16)
      }
    }
  }, 600000)
})
