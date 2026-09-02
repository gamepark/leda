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
 * A card of the fixture: played on the square of its own position in the list, or on the square another card of
 * the list is on, which it covers there.
 */
type Played = ClanCardId | { card: ClanCardId; on: number }

const squareOf = (played: Played, position: number): { card: ClanCardId; parent: number } =>
  typeof played === 'object' ? { card: played.card, parent: played.on } : { card: played, parent: position }

/**
 * The 4 squares of row 1 hold the tiles below, and the cards given to the fixture are played on them, one per
 * square, in the order they are given. The zone of the round is that row, so every one of them can be activated.
 */
const game = (cards: Played[], hand: ClanCardId[] = [], food = 0): MaterialGame<number, MaterialType, LocationType> => ({
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
      ...cards.map((played, position) => {
        const { card, parent } = squareOf(played, position)
        // How high the card stands on its square, which the engine numbers as cards are played (see {@link squares}).
        const z = cards.slice(0, position).filter((before, index) => squareOf(before, index).parent === parent).length
        return { id: { front: card, back: Clan.Panda }, location: { type: LocationType.PlayedCard, player: 1, parent, z } }
      }),
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
    // The Spy first, and what the card writes after it waits for that answer: whatever is left of a card is read
    // again once the question it comes after is answered (see {@link PendingEffectsRule}).
    expect(rules.game.rule?.id).toBe(RuleId.Spy)
    expect(pendingRules(rules)).toEqual([RuleId.PendingEffects, RuleId.ActivateZone])
    playAll(rules, rules.getLegalMoves(1)[0])
    playAll(rules, rules.getLegalMoves(1)[0])
    // Then the card it lets the player play, and the zone once they are done with it.
    expect(rules.game.rule?.id).toBe(RuleId.PlayCard)
    expect(pendingRules(rules)).toEqual([RuleId.ActivateZone])
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

describe('An Awakening', () => {
  /** The Awakenings a player gathered while activating their zone, resolved once the whole zone is done. */
  const resolveAwakenings = (rules: LedaRules, count: number) => {
    rules.game.memory[Memory.Awakenings] = { 1: count }
    playAll(rules, rules.startRule(RuleId.Awakening))
  }

  it('waits for the player as long as a Panda can be raised', () => {
    // 2 Bronze Pandas on the grid and a Silver one in hand: the group is there, and so is the card taking the square.
    const rules = new LedaRules(game([ClanCardId.PandaUpgrade, ClanCardId.PandaFoodOrMilitary], [ClanCardId.PandaMilitary]))
    resolveAwakenings(rules, 1)
    expect(rules.game.rule?.id).toBe(RuleId.Awakening)
    expect(food(rules)).toBe(0)
  })

  it('gives 1 Food instead when the group it takes is not on the grid', () => {
    const rules = new LedaRules(game([ClanCardId.PandaUpgrade], [ClanCardId.PandaMilitary]))
    resolveAwakenings(rules, 1)
    expect(food(rules)).toBe(1)
    expect(rules.game.memory[Memory.Awakenings][1]).toBe(0)
  })

  it('gives 1 Food per Awakening left, what stops one stopping them all', () => {
    // The group of Bronze Pandas is there, but no Silver Panda in hand to take the square of the one raised.
    const rules = new LedaRules(game([ClanCardId.PandaUpgrade, ClanCardId.PandaFoodOrMilitary]))
    resolveAwakenings(rules, 2)
    expect(food(rules)).toBe(2)
  })

  it('leaves out a Panda another card covers, which is no part of the group', () => {
    // 2 Bronze Pandas played, the second of them buried under a card that is no Panda at all: 1 Bronze Panda is
    // left in play, the group is not there, and the Awakening is worth its Food instead.
    const rules = new LedaRules(
      game([ClanCardId.PandaUpgrade, ClanCardId.PandaFoodOrMilitary, { card: ClanCardId.PandaDrawAndSpecialActivation, on: 1 }], [ClanCardId.PandaMilitary])
    )
    resolveAwakenings(rules, 1)
    expect(food(rules)).toBe(1)
    expect(rules.game.memory[Memory.Awakenings][1]).toBe(0)
  })
})

describe('An Upgrade', () => {
  it('offers the tiles no card covers, and only those', () => {
    // The card is on the first square, so the 3 tiles left showing are the ones that may be turned over.
    const rules = new LedaRules(game([ClanCardId.PandaUpgrade]))
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.UpgradeTile)
    expect(rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.Tile))).toHaveLength(3)
  })

  it('is lost when every tile of the grid is under a card', () => {
    // A tile a card covers is off the table: what it shows is hidden, and it is not turned over for being hidden.
    const rules = new LedaRules(game([ClanCardId.PandaUpgrade, ClanCardId.PandaMilitary, ClanCardId.PandaMilitary, ClanCardId.PandaMilitary]))
    activate(rules, 0)
    expect(rules.game.rule?.id).not.toBe(RuleId.UpgradeTile)
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

/**
 * The FAQ of the game answers what the rulebook leaves out: nothing is activated twice during one activation
 * phase, whichever effect asks for it (see {@link Memory.ActivatedItems}).
 */
describe('Nothing is activated twice during one activation phase', () => {
  it('leaves the Queen no card she has already been through', () => {
    const rules = new LedaRules(game([ClanCardId.PandaQueen, ClanCardId.PandaMilitary]))
    // The other card gives what it gives as its own square of the zone is activated.
    activate(rules, 1)
    expect(military(rules)).toBe(2)
    activate(rules, 0)
    // The Queen has nothing left to activate, and is lost rather than giving that card a second turn.
    expect(rules.game.rule?.id).not.toBe(RuleId.ActivateCard)
    expect(military(rules)).toBe(2)
  })

  it('leaves the zone no square whose card the Queen has already activated', () => {
    const rules = new LedaRules(game([ClanCardId.PandaQueen, ClanCardId.PandaMilitary]))
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateCard)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    expect(military(rules)).toBe(2)
    // Back to the zone, where the square of that card is no longer one of the squares left to activate.
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
    const cells = rules
      .getLegalMoves(1)
      .filter(isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare))
      .map((move) => move.data)
    expect(cells).not.toContainEqual({ x: 1, y: 0 })
    // The 2 bare Food tiles of the row, and nothing else.
    expect(cells).toEqual([{ x: 2, y: 0 }, { x: 3, y: 0 }])
  })
})
