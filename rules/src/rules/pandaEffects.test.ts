import { isCustomMoveType, isMoveItemType, MaterialGame, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId } from '../material/ClanCardId'
import { Effect } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { TileId } from '../material/TileId'
import { CustomMoveType } from './CustomMoveType'
import { pendingChoices, pendingRules } from './effects'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * The 4 squares of row 1 hold the tiles below, and the cards given to the fixture are played on them, one per
 * square, in the order they are given. The zone of the round is that row, so every one of them can be activated.
 */
const game = (cards: ClanCardId[], hand: ClanCardId[] = [], food = 0): MaterialGame<number, MaterialType, LocationType> => ({
  players: [1, 2],
  rule: { id: RuleId.ActivateZone, player: 1 },
  memory: {
    [Memory.ActionZone]: ActionZone.Row1,
    [Memory.ActivatedCells]: { 1: [], 2: [] },
    [Memory.MilitarySymbols]: { 1: 0, 2: 0 },
    [Memory.RoundPlayer]: 2
  },
  items: {
    [MaterialType.VictoryConditionCard]: [{ id: Clan.Panda, location: { type: LocationType.PlayerVictoryCondition, player: 1 } }],
    [MaterialType.Tile]: [0, 1, 2, 3].map((x) => ({ id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player: 1, x, y: 0 } })),
    [MaterialType.ClanCard]: [
      ...cards.map((front, parent) => ({ id: { front, back: Clan.Panda }, location: { type: LocationType.PlayedCard, player: 1, parent } })),
      ...hand.map((front) => ({ id: { front, back: Clan.Panda }, location: { type: LocationType.PlayerHand, player: 1 } })),
      { id: { back: Clan.Panda }, location: { type: LocationType.PlayerDeck, player: 1, x: 0 } }
    ],
    [MaterialType.FoodToken]: food > 0 ? [{ location: { type: LocationType.PlayerFood, player: 1 }, quantity: food }] : [],
    [MaterialType.MilitaryVictoryToken]: [{ id: MilitaryVictoryTokenId.Food, location: { type: LocationType.MilitaryVictoryDeck, x: 0 } }]
  }
})

/** Plays a move and every consequence it has, the way the engine does. */
const playAll = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  for (const consequence of rules.play(move)) playAll(rules, consequence)
}

const activate = (rules: LedaRules, x: number) => playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x, y: 0 }))

const food = (rules: LedaRules, player = 1) => rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(player).getQuantity()

const military = (rules: LedaRules, player = 1) => rules.game.memory[Memory.MilitarySymbols][player]

describe('A card played on a square', () => {
  it('gives what it gives instead of what its tile gives', () => {
    const rules = new LedaRules(game([ClanCardId.PandaMilitary]))
    activate(rules, 0)
    // The tile under it is a Food tile: the card covers it, so the Food is not gained.
    expect(military(rules)).toBe(2)
    expect(food(rules)).toBe(0)
  })

  it('leaves nothing to activate when the face it shows gives nothing', () => {
    // A Shark card outside of its Pack, which prints nothing at all: it covers its tile all the same, so its
    // square holds nothing to resolve and is not offered.
    const rules = new LedaRules(game([ClanCardId.SharkPackSpy]))
    expect(rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))).toHaveLength(3)
  })

  it('is not turned over the way a temporary tile is', () => {
    const rules = new LedaRules(game([ClanCardId.PandaMilitary]))
    activate(rules, 0)
    expect(rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).getItem()?.location.rotation).toBeUndefined()
  })
})

describe('An "OR" effect', () => {
  it('asks the player which branch they resolve, and resolves that one alone', () => {
    const rules = new LedaRules(game([ClanCardId.PandaFoodOrMilitary]))
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.ChooseEffect)
    expect(pendingChoices(rules)[0].or).toEqual([{ [Effect.Food]: 1 }, { [Effect.Military]: 1 }])
    playAll(rules, rules.customMove(CustomMoveType.ChooseEffect, 1))
    expect(military(rules)).toBe(1)
    expect(food(rules)).toBe(0)
    // The zone is what takes over once the choice is made.
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
  })

  it('is what the special activation of the Pandas is, the crystal telling where it comes from', () => {
    const rules = new LedaRules(game([ClanCardId.PandaDrawAndSpecialActivation]))
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.ChooseEffect)
    expect(pendingChoices(rules)[0].from).toBe(Effect.SpecialActivation)
    playAll(rules, rules.customMove(CustomMoveType.ChooseEffect, 1))
    expect(rules.game.memory[Memory.Awakenings][1]).toBe(1)
  })
})

describe('A card that asks the player several things', () => {
  it('asks them in the order it is written, and hands the zone back at the end', () => {
    const rules = new LedaRules(game([ClanCardId.PandaSpyAndDiscount], [ClanCardId.PandaUpgrade], 5))
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.Spy)
    expect(pendingRules(rules)).toEqual([RuleId.PlayCard, RuleId.ActivateZone])
  })

  it('takes the discount off the price of the card it lets the player play', () => {
    const rules = new LedaRules(game([ClanCardId.PandaFoodAndDiscount], [ClanCardId.PandaUpgrade], 3))
    activate(rules, 0)
    // 1 Food gained, then the card is offered at 5 - 1 = 4, which the 4 Food now owned pay for.
    expect(rules.game.rule?.id).toBe(RuleId.PlayCard)
    expect(food(rules)).toBe(4)
    const play = rules.getLegalMoves(1).find(isMoveItemType(MaterialType.ClanCard))!
    playAll(rules, play)
    expect(food(rules)).toBe(0)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
  })

  it('lets the player turn down what they are only allowed to do', () => {
    const rules = new LedaRules(game([ClanCardId.PandaFoodAndDiscount], [ClanCardId.PandaUpgrade], 5))
    activate(rules, 0)
    playAll(rules, rules.customMove(CustomMoveType.Pass))
    expect(food(rules)).toBe(6)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
  })
})

describe('The King and the Queen', () => {
  it('draws a Military Victory token and resolves it', () => {
    const rules = new LedaRules(game([ClanCardId.PandaKing]))
    activate(rules, 0)
    expect(military(rules)).toBe(2)
    expect(rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(1).length).toBe(1)
    // The token drawn gives 1 Food on top of its Victory symbol.
    expect(food(rules)).toBe(1)
  })

  it('activates another card in play, and never herself', () => {
    const rules = new LedaRules(game([ClanCardId.PandaQueen, ClanCardId.PandaMilitary]))
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateCard)
    // The square of the other card, the Queen never being offered her own.
    const choices = rules.getLegalMoves(1).filter(isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare))
    expect(choices.map((move) => move.data)).toEqual([{ x: 1, y: 0 }])
    playAll(rules, choices[0])
    expect(military(rules)).toBe(2)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
  })
})
