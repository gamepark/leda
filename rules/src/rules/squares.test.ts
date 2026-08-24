import { isMoveItemType, MaterialGame } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId, ClanCardItemId } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { TileId } from '../material/TileId'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { cardsInPlay, topCardOn, visibleCards } from './squares'

/** The first square of the grid, the only one these tests play on. */
const cell = { x: 0, y: 0 }

/**
 * A Panda player about to organise their grid, holding one card and having one already played on their first
 * square.
 *
 * The card in hand is created before the one in play on purpose: which card covers a square is the last one
 * played there, and nothing else. The index of an item is the slot it was created in, that is the printed order
 * of the clan deck, so a card played over another may perfectly well have a lower index than the one it covers.
 */
const game = (): MaterialGame<number, MaterialType, LocationType> => ({
  players: [1, 2],
  rule: { id: RuleId.Organisation, player: 1 },
  memory: {
    [Memory.ActionZone]: ActionZone.Row1,
    [Memory.ActivatedCells]: { 1: [], 2: [] },
    [Memory.MilitarySymbols]: { 1: 0, 2: 0 },
    [Memory.RoundPlayer]: 1
  },
  items: {
    [MaterialType.VictoryConditionCard]: [{ id: Clan.Panda, location: { type: LocationType.PlayerVictoryCondition, player: 1 } }],
    [MaterialType.Tile]: [0, 1, 2, 3].flatMap((y) =>
      [0, 1, 2, 3].map((x) => ({ id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player: 1, x, y } }))
    ),
    [MaterialType.ClanCard]: [
      { id: { front: ClanCardId.PandaFoodOrMilitary, back: Clan.Panda }, location: { type: LocationType.PlayerHand, player: 1, x: 0 } },
      { id: { front: ClanCardId.PandaUpgrade, back: Clan.Panda }, location: { type: LocationType.PlayedCard, player: 1, parent: 0, z: 0 } }
    ],
    [MaterialType.FoodToken]: [{ location: { type: LocationType.PlayerFood, player: 1 }, quantity: 10 }]
  }
})

/** The move that plays the card of the hand onto the square that already holds one. */
const playOnOccupiedSquare = (rules: LedaRules) =>
  rules
    .getLegalMoves(1)
    .filter(isMoveItemType(MaterialType.ClanCard))
    .find((move) => move.location.type === LocationType.PlayedCard && move.location.parent === 0)

describe('A card played on a square that already holds one', () => {
  it('may be played there, the square being no less playable for holding a card', () => {
    expect(playOnOccupiedSquare(new LedaRules(game()))).toBeDefined()
  })

  it('covers the card that was there, whatever the order the 2 were created in', () => {
    const rules = new LedaRules(game())
    rules.play(playOnOccupiedSquare(rules)!)
    expect(topCardOn(rules, 1, cell)).toBe(ClanCardId.PandaFoodOrMilitary)
  })

  it('stands one card higher than the one it covers, which is what puts it over it on the table', () => {
    const rules = new LedaRules(game())
    rules.play(playOnOccupiedSquare(rules)!)
    const heights = cardsInPlay(rules, 1)
      .getItems<ClanCardItemId>()
      .map((card) => [card.id?.front, card.location.z])
    expect(heights).toEqual(
      expect.arrayContaining([
        [ClanCardId.PandaUpgrade, 0],
        [ClanCardId.PandaFoodOrMilitary, 1]
      ])
    )
  })

  it('leaves the covered card in play and out of sight, counted by nothing', () => {
    const rules = new LedaRules(game())
    rules.play(playOnOccupiedSquare(rules)!)
    expect(cardsInPlay(rules, 1).length).toBe(2)
    expect(visibleCards(rules, 1).getItems<ClanCardItemId>().map((card) => card.id?.front)).toEqual([ClanCardId.PandaFoodOrMilitary])
  })
})
