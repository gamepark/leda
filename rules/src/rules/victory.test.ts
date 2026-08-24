import { isMoveItemType, MaterialGame, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { gridCorners } from '../material/PlayerGrid'
import { TileId } from '../material/TileId'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { sharkTokens } from './sharkPack'
import { hasSpecialVictory } from './victory'

/** A card in play, several on one square piling up in the order they are given, the last one on top. */
type Played = { card: ClanCardId; cell: XYCoordinates }

type Setup = {
  /** The clan of the player, which is what says how they may win besides the military victory. */
  clan: Clan
  /** Their cards in play. */
  cards?: Played[]
  /** The cards they hold, which the tests that end the game by playing one need. */
  hand?: ClanCardId[]
  /** The Military Victory tokens they have already won. */
  won?: MilitaryVictoryTokenId[]
  /** The token the pile is about to hand to the winner of the conflict. */
  top?: MilitaryVictoryTokenId
  /** The squares of their grid that hold one of their Shark tokens, the rest of the 9 staying in their supply. */
  tokens?: XYCoordinates[]
  /** The Food they own, which they pay the cards they play with. */
  food?: number
  /** The step being played: an activation unless the test ends the game somewhere else. */
  rule?: RuleId
}

/** A card names the tile it covers by its index: the 16 tiles of the player come first, then the 16 of the opponent. */
const tileIndex = (cell: XYCoordinates) => cell.y * 4 + cell.x

/** Any clan but the one the player took, so that both Victory condition cards are on the table. */
const opponentClan = (clan: Clan) => (clan === Clan.Panda ? Clan.Shark : Clan.Panda)

/**
 * The cards of the player in play, each numbered by how high it stands on its square: the engine numbers them
 * that way as they are played, and several cards on one square pile up in the order they are given here
 * (see {@link squares}).
 */
const played = (cards: Played[], clan: Clan) => {
  const heights: Record<number, number> = {}
  return cards.map(({ card, cell }) => {
    const parent = tileIndex(cell)
    heights[parent] = (heights[parent] ?? -1) + 1
    return { id: { front: card, back: clan }, location: { type: LocationType.PlayedCard, player: 1, parent, z: heights[parent] } }
  })
}

/**
 * A player of the clan under test and their opponent, both with a grid of bare permanent tiles. Everything the
 * victories are read on is given by the test: what is in play, what has been won, what has been placed.
 */
const game = ({ clan, cards = [], hand = [], won = [], top, tokens = [], food = 0, rule = RuleId.ActivateZone }: Setup): MaterialGame<
  number,
  MaterialType,
  LocationType
> => ({
  players: [1, 2],
  rule: { id: rule, player: 1 },
  memory: {
    [Memory.ActionZone]: ActionZone.Row1,
    [Memory.ActivatedCells]: { 1: [], 2: [] },
    [Memory.MilitarySymbols]: { 1: 0, 2: 0 },
    [Memory.RoundPlayer]: 1
  },
  items: {
    [MaterialType.VictoryConditionCard]: [
      { id: clan, location: { type: LocationType.PlayerVictoryCondition, player: 1 } },
      { id: opponentClan(clan), location: { type: LocationType.PlayerVictoryCondition, player: 2 } }
    ],
    [MaterialType.Tile]: [1, 2].flatMap((player) =>
      [0, 1, 2, 3].flatMap((y) => [0, 1, 2, 3].map((x) => ({ id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player, x, y } })))
    ),
    [MaterialType.ClanCard]: [
      ...played(cards, clan),
      ...hand.map((front, x) => ({ id: { front, back: clan }, location: { type: LocationType.PlayerHand, player: 1, x } }))
    ],
    [MaterialType.SharkToken]: [
      ...tokens.map((cell) => ({ location: { type: LocationType.PlacedSharkToken, player: 1, parent: tileIndex(cell) } })),
      ...(clan === Clan.Shark && tokens.length < sharkTokens
        ? [{ location: { type: LocationType.PlayerSharkSupply, player: 1 }, quantity: sharkTokens - tokens.length }]
        : [])
    ],
    [MaterialType.MilitaryVictoryToken]: [
      ...won.map((id, x) => ({ id, location: { type: LocationType.PlayerMilitaryVictory, player: 1, x } })),
      ...(top === undefined ? [] : [{ id: top, location: { type: LocationType.MilitaryVictoryDeck, x: 0 } }])
    ],
    [MaterialType.FoodToken]: food > 0 ? [{ location: { type: LocationType.PlayerFood, player: 1 }, quantity: food }] : []
  }
})

const playAll = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  for (const consequence of rules.play(move)) playAll(rules, consequence)
}

/** That many Victory tokens won, each worth 1 Victory symbol. */
const victories = (count: number) => Array.from({ length: count }, () => MilitaryVictoryTokenId.Victory)

/**
 * The conflict of the round, won by the player: they take the top token of the pile and resolve it, which is the
 * one way of winning a token that every game goes through.
 */
const winConflict = (rules: LedaRules) => {
  rules.game.memory[Memory.MilitarySymbols] = { 1: 1, 2: 0 }
  playAll(rules, rules.startRule(RuleId.MilitaryConflict))
}

/** The move that plays that card of the hand onto that square, which the player has to be able to pay for. */
const play = (rules: LedaRules, card: ClanCardId, cell: XYCoordinates) => {
  const cards = rules.material(MaterialType.ClanCard)
  const move = rules
    .getLegalMoves(1)
    .filter(isMoveItemType(MaterialType.ClanCard))
    .find(
      (move) =>
        move.location.type === LocationType.PlayedCard && move.location.parent === tileIndex(cell) && cards.getItem(move.itemIndex).id.front === card
    )
  expect(move, `${ClanCardId[card]} is not offered on ${JSON.stringify(cell)}`).toBeDefined()
  playAll(rules, move!)
}

/**
 * A card put in play straight from the hand, which is the shortcut these tests take to the 2 ways of doing it
 * that are a step of their own: the Awakening of a Gold Panda and the window a Ring is put in play in. What is
 * being tested here is the victory a card in play wins, and each of those 2 steps is tested where it belongs
 * (see {@link AwakeningRule} and {@link rings.test}).
 */
const playFromHand = (rules: LedaRules, card: ClanCardId, cell: XYCoordinates) => {
  const [index] = rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayerHand)
    .id((id) => id.front === card)
    .getIndexes()
  playAll(rules, rules.material(MaterialType.ClanCard).index(index).moveItem({ type: LocationType.PlayedCard, player: 1, parent: tileIndex(cell) }))
}

/** The winner the game ended on, and undefined while it is still being played. */
const winner = (rules: LedaRules): number | undefined => {
  if (!rules.isOver()) return undefined
  return [1, 2].find((player) => [1, 2].every((other) => rules.rankPlayers(player, other) <= 0))
}

describe('The military victory', () => {
  /** The Victory symbols each clan has to gather, which its own Victory condition card prints. */
  const symbolsToWin: [Clan, number][] = [
    [Clan.Scorpion, 6],
    [Clan.Panda, 7],
    [Clan.Cat, 8],
    [Clan.Shark, 9]
  ]

  for (const [clan, symbols] of symbolsToWin) {
    it(`ends the game on the ${symbols}th Victory symbol of a ${Clan[clan]} player`, () => {
      const rules = new LedaRules(game({ clan, won: victories(symbols - 1), top: MilitaryVictoryTokenId.Victory }))
      winConflict(rules)
      expect(winner(rules)).toBe(1)
    })

    it(`leaves the game on with ${symbols - 1} of them for a ${Clan[clan]} player`, () => {
      const rules = new LedaRules(game({ clan, won: victories(symbols - 2), top: MilitaryVictoryTokenId.Victory }))
      winConflict(rules)
      expect(rules.isOver()).toBe(false)
      // The round goes on to phase 3, the organisation, as it does every round.
      expect(rules.game.rule?.id).toBe(RuleId.Organisation)
    })
  }

  it('counts the symbols of the tokens and not the tokens', () => {
    // 6 tokens worth 1 symbol each, and a 7th worth 2: the 8 symbols of the Cats on 7 tokens.
    const rules = new LedaRules(game({ clan: Clan.Cat, won: victories(6), top: MilitaryVictoryTokenId.DoubleVictory }))
    winConflict(rules)
    expect(winner(rules)).toBe(1)
  })
})

describe('The special victory of the Pandas', () => {
  const king = { card: ClanCardId.PandaKing, cell: { x: 0, y: 0 } }

  it('ends the game once the King and the Queen are both in play', () => {
    const rules = new LedaRules(game({ clan: Clan.Panda, cards: [king], hand: [ClanCardId.PandaQueen] }))
    // A Gold Panda reaches the grid through an Awakening, which plays it from the hand onto a square of the grid.
    playFromHand(rules, ClanCardId.PandaQueen, { x: 1, y: 0 })
    expect(winner(rules)).toBe(1)
  })

  it('leaves the game on with the King alone', () => {
    const rules = new LedaRules(game({ clan: Clan.Panda, cards: [king] }))
    expect(hasSpecialVictory(rules, 1)).toBe(false)
  })
})

describe('The special victory of the Sharks', () => {
  /** 8 squares of the grid holding a token, which leaves 1 in the supply and 8 bare squares to place it on. */
  const eightTokens = [0, 1, 2, 3].flatMap((x) => [{ x, y: 0 } as XYCoordinates, { x, y: 1 } as XYCoordinates])

  it('ends the game on the 9th token placed', () => {
    const rules = new LedaRules(
      game({
        clan: Clan.Shark,
        tokens: eightTokens,
        hand: [ClanCardId.SharkPackRedrawToken],
        food: 3,
        rule: RuleId.Organisation
      })
    )
    // A Shark card played takes the token of its square out of the supply (see sharkMoves).
    play(rules, ClanCardId.SharkPackRedrawToken, { x: 0, y: 3 })
    expect(winner(rules)).toBe(1)
  })

  it('leaves the game on while one token is left in the supply', () => {
    const rules = new LedaRules(game({ clan: Clan.Shark, tokens: eightTokens.slice(0, 7), hand: [ClanCardId.SharkPackRedrawToken], food: 3, rule: RuleId.Organisation }))
    play(rules, ClanCardId.SharkPackRedrawToken, { x: 0, y: 3 })
    expect(rules.isOver()).toBe(false)
  })
})

describe('The special victory of the Cats', () => {
  const rings = [ClanCardId.CatRingEmptyDeck, ClanCardId.CatRingThreeCatCards, ClanCardId.CatRingFiveUpgradedTiles]

  it('ends the game on the 3rd Ring in play', () => {
    const inPlay = rings.slice(0, 2).map((card, x) => ({ card, cell: { x, y: 0 } }))
    const rules = new LedaRules(game({ clan: Clan.Cat, cards: inPlay, hand: [rings[2]] }))
    playFromHand(rules, rings[2], { x: 2, y: 0 })
    expect(winner(rules)).toBe(1)
  })

  it('leaves the game on with 2 of them', () => {
    const inPlay = rings.slice(0, 2).map((card, x) => ({ card, cell: { x, y: 0 } }))
    const rules = new LedaRules(game({ clan: Clan.Cat, cards: inPlay }))
    expect(hasSpecialVictory(rules, 1)).toBe(false)
  })

  it('does not count a Ring another card was played over', () => {
    const rules = new LedaRules(
      game({
        clan: Clan.Cat,
        cards: [
          ...rings.map((card, x) => ({ card, cell: { x, y: 0 } })),
          // Played on the square of the 3rd Ring, and over it.
          { card: ClanCardId.CatDrawAndFood, cell: { x: 2, y: 0 } }
        ]
      })
    )
    expect(hasSpecialVictory(rules, 1)).toBe(false)
  })
})

describe('The special victory of the Scorpions', () => {
  const portals = [
    ClanCardId.ScorpionPortalDoubleSpy,
    ClanCardId.ScorpionPortalFlipOpponentTile,
    ClanCardId.ScorpionPortalSwap,
    ClanCardId.ScorpionPortalBlockMilitaryVictory
  ]

  const inCorners = (count: number) => portals.slice(0, count).map((card, corner) => ({ card, cell: gridCorners[corner] }))

  it('ends the game once the 4 Portals are in the 4 corners', () => {
    const rules = new LedaRules(
      game({ clan: Clan.Scorpion, cards: inCorners(3), hand: [portals[3]], food: 9, rule: RuleId.Organisation })
    )
    play(rules, portals[3], gridCorners[3])
    expect(winner(rules)).toBe(1)
  })

  it('leaves the game on while one of them is anywhere else', () => {
    const rules = new LedaRules(
      game({ clan: Clan.Scorpion, cards: inCorners(3), hand: [portals[3]], food: 9, rule: RuleId.Organisation })
    )
    play(rules, portals[3], { x: 1, y: 1 })
    expect(rules.isOver()).toBe(false)
  })

  it('ends the game when a swap brings the last Portal into its corner', () => {
    const rules = new LedaRules(
      game({ clan: Clan.Scorpion, cards: [...inCorners(3), { card: portals[3], cell: { x: 1, y: 1 } }], rule: RuleId.Organisation })
    )
    // A card follows the tile of its square, so swapping 2 squares moves what is played on them.
    const tiles = rules.material(MaterialType.Tile)
    const [middle] = tiles.location((location) => location.player === 1 && location.x === 1 && location.y === 1).getIndexes()
    playAll(rules, tiles.index(middle).moveItem({ type: LocationType.PlayerGrid, player: 1, ...gridCorners[3] }))
    expect(winner(rules)).toBe(1)
  })
})
