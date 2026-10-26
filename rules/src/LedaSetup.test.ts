import { createGameOptions } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan, clanStart } from './Clan'
import { ClanSelection } from './ClanSelection'
import { LedaOptions, LedaOptionsSpecV2 } from './LedaOptions'
import { LedaRules } from './LedaRules'
import { LedaSetup } from './LedaSetup'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { RuleId } from './rules/RuleId'

const setup = (options: LedaOptions) => new LedaRules(new LedaSetup().setup(options))

describe('Clan selection', () => {
  it('lets players choose their clan at the table by default', () => {
    const options = createGameOptions(LedaOptionsSpecV2, { clanSelection: ClanSelection.InGame }, 2) as LedaOptions
    expect(options.players).toBe(2)
    const rules = setup(options)
    expect(rules.game.players).toEqual([1, 2])
    expect(rules.game.rule?.id).toBe(RuleId.ChooseClan)
  })

  it('makes the clan picked before the game the player identity in free selection', () => {
    const options = createGameOptions(LedaOptionsSpecV2, { clanSelection: ClanSelection.Free }, 2, {
      id: [Clan.Scorpion, Clan.Cat]
    }) as LedaOptions
    const rules = setup(options)
    expect([...rules.game.players].sort()).toEqual([Clan.Cat, Clan.Scorpion])
    expect(rules.game.rule?.id).toBe(RuleId.Mulligan)
    for (const player of rules.players) {
      expect(rules.material(MaterialType.VictoryConditionCard).player(player).getItem()?.id).toBe(player)
      const cards = rules.material(MaterialType.ClanCard).player(player)
      expect(cards.getItems<{ back: Clan }>().every((item) => item.id.back === player)).toBe(true)
      expect(cards.location(LocationType.PlayerHand)).toHaveLength(clanStart[player as Clan].cards)
      expect(rules.material(MaterialType.FoodToken).player(player).getQuantity()).toBe(clanStart[player as Clan].food)
    }
  })

  it('creates the Shark tokens and gives no Food to the Snakes', () => {
    const options = createGameOptions(LedaOptionsSpecV2, { clanSelection: ClanSelection.Free }, 2, {
      id: [Clan.Shark, Clan.Snake]
    }) as LedaOptions
    const rules = setup(options)
    expect(rules.material(MaterialType.SharkToken).player(Clan.Shark).getQuantity()).toBeGreaterThan(0)
    expect(rules.material(MaterialType.FoodToken).player(Clan.Snake)).toHaveLength(0)
  })
})
