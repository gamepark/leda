import { CustomMove, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan, playableClans } from '../Clan'
import { LedaRules } from '../LedaRules'
import { LedaSetup } from '../LedaSetup'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { playerClan } from './specialActivation'
import { RuleId } from './RuleId'

/** Plays a move and every consequence it owes, each one before the moves already waiting, as the framework does. */
const playWithConsequences = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  const queue = [move]
  while (queue.length > 0) {
    queue.unshift(...rules.play(rules.randomize(queue.shift()!)))
  }
}

const clansOffered = (rules: LedaRules) => rules.getLegalMoves(rules.getActivePlayer()!).map((move) => (move as CustomMove).data as Clan)

const chooseClan = (rules: LedaRules, clan: Clan) => {
  const move = rules.getLegalMoves(rules.getActivePlayer()!).find((move) => (move as CustomMove).data === clan)
  expect(move).toBeDefined()
  playWithConsequences(rules, move!)
}

const pile = (rules: LedaRules) => rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck)

describe('Tournament rules', () => {
  it('keep every Military Victory token without the option', () => {
    const rules = new LedaRules(new LedaSetup().setup({ players: 2 }))
    expect(pile(rules).length).toBe(18)
    expect(pile(rules).id(MilitaryVictoryTokenId.DoubleVictory).length).toBe(2)
  })

  it('leave the 2 tokens worth 2 Victory symbols out of the pile', () => {
    const rules = new LedaRules(new LedaSetup().setup({ players: 2, tournamentRules: true }))
    expect(pile(rules).length).toBe(16)
    expect(pile(rules).id(MilitaryVictoryTokenId.DoubleVictory).length).toBe(0)
  })

  it('forbid a mirror match without the option', () => {
    const rules = new LedaRules(new LedaSetup().setup({ players: 2 }))
    chooseClan(rules, Clan.Shark)
    expect(clansOffered(rules)).not.toContain(Clan.Shark)
  })

  it('allow a mirror match', () => {
    const rules = new LedaRules(new LedaSetup().setup({ players: 2, tournamentRules: true, snakesClan: true }))
    const [first, second] = rules.players
    chooseClan(rules, Clan.Shark)
    expect(clansOffered(rules)).toEqual(playableClans)
    chooseClan(rules, Clan.Shark)
    expect(playerClan(rules, first)).toBe(Clan.Shark)
    expect(playerClan(rules, second)).toBe(Clan.Shark)
    expect(rules.game.rule?.id).toBe(RuleId.Mulligan)
    for (const player of rules.players) {
      expect(rules.material(MaterialType.SharkToken).location(LocationType.PlayerSharkSupply).player(player).getQuantity()).toBeGreaterThan(0)
      expect(rules.material(MaterialType.ClanCard).player(player).length).toBe(
        rules.material(MaterialType.ClanCard).player(first === player ? second : first).length
      )
    }
  })
})

describe('Snakes clan option', () => {
  it('leaves the Snakes out without the option', () => {
    const rules = new LedaRules(new LedaSetup().setup({ players: 2 }))
    expect(clansOffered(rules)).toEqual(playableClans.filter((clan) => clan !== Clan.Snake))
  })

  it('leaves the Snakes out of the tournament rules without the option', () => {
    const rules = new LedaRules(new LedaSetup().setup({ players: 2, tournamentRules: true }))
    chooseClan(rules, Clan.Shark)
    expect(clansOffered(rules)).not.toContain(Clan.Snake)
  })

  it('offers the Snakes with the option', () => {
    const rules = new LedaRules(new LedaSetup().setup({ players: 2, snakesClan: true }))
    expect(clansOffered(rules)).toEqual(playableClans)
    chooseClan(rules, Clan.Snake)
    expect(clansOffered(rules)).not.toContain(Clan.Snake)
  })
})
