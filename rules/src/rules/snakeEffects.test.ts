import { isCustomMoveType, isMoveItemType, MaterialGame, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId, ClanCardItemId } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { TileId } from '../material/TileId'
import { hatchableCells } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { cardDiscount, pendingRules } from './effects'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { eggCost, playedEggs, snakesInPlay } from './snake'
import { roundSpies } from './spy'
import { isGridSettled } from './swap'
import { hasSpecialVictory } from './victory'

/**
 * The Snakes, read on the one thing that tells them from every other clan: their cards are played as Eggs, they
 * give nothing until their owner pays to hatch them, and what they are is their owner's secret until then.
 */

/** A card in play, on its Egg side unless the test hatches it. `snake` is the hatched side. */
type Played = { card: ClanCardId; cell: XYCoordinates; snake?: boolean }

type Setup = {
  /** The cards the player has in play, one per square unless a test piles them up. */
  cards?: Played[]
  /** The squares that hold a permanent tile rather than the Desert every square holds by default. */
  permanent?: XYCoordinates[]
  /** The cards the player holds, or simply how many of them. */
  hand?: ClanCardId[] | number
  /** The Food the player owns, which is what they pay their Eggs and their hatchings with. */
  food?: number
  /** The Food the opponent owns, which one of the Hatching effects steals. */
  opponentFood?: number
  /** The cards the opponent has in play, which are Cat cards: the 2 players never hold the same clan. */
  opponentCards?: { card: ClanCardId; cell: XYCoordinates }[]
}

const index = ({ x, y }: XYCoordinates) => y * 4 + x

/**
 * A grid of Deserts, which give nothing when the zone is activated: what a square of these tests is worth is
 * whatever card was played on it, and nothing else.
 */
const grid = (player: number, permanent: XYCoordinates[]) =>
  [0, 1, 2, 3].flatMap((y) =>
    [0, 1, 2, 3].map((x) => {
      const location = { type: LocationType.PlayerGrid, player, x, y }
      return permanent.some((cell) => cell.x === x && cell.y === y)
        ? { id: TileId.PermanentFood, location }
        : { id: TileId.TemporaryFood, location: { ...location, rotation: true } }
    })
  )

/** A hand given as a number is that many cards worth nothing in particular, which any card of the clan is. */
const handOf = (hand: ClanCardId[] | number): ClanCardId[] =>
  typeof hand === 'number' ? Array.from({ length: hand }, () => ClanCardId.SnakeMilitary) : hand

/** The cards of one player in play, numbered by how high each stands on its square, as the engine numbers them. */
const playedCards = (cards: Played[], player: number, clan: Clan, offset = 0) => {
  const heights: Record<number, number> = {}
  return cards.map(({ card, cell, snake }) => {
    const parent = offset + index(cell)
    heights[parent] = (heights[parent] ?? -1) + 1
    const location = { type: LocationType.PlayedCard, player, parent, z: heights[parent] }
    return { id: { front: card, back: clan }, location: snake === true ? { ...location, rotation: true } : location }
  })
}

/** A Snake player against a Cat one, the zone of the round set on row 1, which is where the cards below are played. */
const game = ({ cards = [], permanent = [], hand = 0, food = 0, opponentFood = 0, opponentCards = [] }: Setup): MaterialGame<
  number,
  MaterialType,
  LocationType
> => ({
  players: [1, 2],
  rule: { id: RuleId.ActivateZone, player: 1 },
  memory: {
    [Memory.ActionZone]: ActionZone.Row1,
    [Memory.ActivatedCells]: { 1: [], 2: [] },
    [Memory.MilitarySymbols]: { 1: 0, 2: 0 },
    [Memory.RoundPlayer]: 1
  },
  items: {
    [MaterialType.VictoryConditionCard]: [
      { id: Clan.Snake, location: { type: LocationType.PlayerVictoryCondition, player: 1 } },
      { id: Clan.Cat, location: { type: LocationType.PlayerVictoryCondition, player: 2 } }
    ],
    /**
     * The opponent keeps one square of the zone worth activating, so that a round never rolls on past the phase
     * being read: their turn opens and the game stops there, where everything below is measured.
     */
    [MaterialType.Tile]: [...grid(1, permanent), ...grid(2, [{ x: 0, y: 0 }])],
    [MaterialType.ClanCard]: [
      ...playedCards(cards, 1, Clan.Snake),
      // The 16 tiles of the player come first in the grid, so a square of the opponent is 16 tiles further on.
      ...playedCards(opponentCards, 2, Clan.Cat, 16),
      ...handOf(hand).map((front, x) => ({ id: { front, back: Clan.Snake }, location: { type: LocationType.PlayerHand, player: 1, x } })),
      { id: { back: Clan.Snake }, location: { type: LocationType.PlayerDeck, player: 1, x: 0 } }
    ],
    [MaterialType.FoodToken]: [
      ...(food > 0 ? [{ location: { type: LocationType.PlayerFood, player: 1 }, quantity: food }] : []),
      ...(opponentFood > 0 ? [{ location: { type: LocationType.PlayerFood, player: 2 }, quantity: opponentFood }] : [])
    ],
    [MaterialType.MilitaryVictoryToken]: [{ id: MilitaryVictoryTokenId.Food, location: { type: LocationType.MilitaryVictoryDeck, x: 0 } }]
  }
})

const playAll = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  for (const consequence of rules.play(move)) playAll(rules, consequence)
}

const hatch = (rules: LedaRules, cell: XYCoordinates) => playAll(rules, rules.customMove(CustomMoveType.HatchEgg, cell))

const activate = (rules: LedaRules, cell: XYCoordinates) => playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, cell))

const military = (rules: LedaRules, player = 1) => rules.game.memory[Memory.MilitarySymbols][player]

const food = (rules: LedaRules, player = 1) => rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(player).getQuantity()

const handSize = (rules: LedaRules) => rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(1).length

/** The square the card being tested is played on, in the row the zone of the round is set to. */
const played = { x: 0, y: 0 }

/** The 3 other squares of the zone, where a test puts the Eggs it wants hatched alongside the first one. */
const zone = [
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 3, y: 0 }
]

/** Squares outside the zone, where a card is in play and out of reach of the activation of the round. */
const outside = [0, 1, 2, 3].flatMap((y) => [0, 1, 2, 3].map((x) => ({ x, y }))).filter((cell) => cell.y > 0)

/** The Snakes a test needs in play to reach a threshold, laid outside the zone so that none of them is activated. */
const snakesOutside = (count: number, card = ClanCardId.SnakeMilitary): Played[] =>
  outside.slice(0, count).map((cell) => ({ card, cell, snake: true }))

describe('An Egg on the grid', () => {
  it('gives nothing, so its square is never one the zone asks its owner to activate', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeStealFoodAndMilitary, cell: played }], food: eggCost }))
    expect(rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))).toHaveLength(0)
  })

  it('is offered to be hatched, for the 2 Food the Egg prints', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeStealFoodAndMilitary, cell: played }], food: eggCost }))
    expect(hatchableCells(rules, 1)).toEqual([played])
    hatch(rules, played)
    expect(food(rules)).toBe(0)
  })

  it('is not offered to a player who cannot pay for it', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeStealFoodAndMilitary, cell: played }], food: eggCost - 1 }))
    expect(hatchableCells(rules, 1)).toEqual([])
  })

  it('covers the tile of its square, which is therefore not activated instead', () => {
    // A permanent tile under the Egg: without the card it would give 1 Food when the zone reaches that square.
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }], permanent: [played], food: 0 }))
    expect(rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))).toHaveLength(0)
  })

  it('leaves its owner free to end the phase without hatching it', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }], food: eggCost }))
    const pass = rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.Pass))
    expect(pass).toHaveLength(1)
    playAll(rules, pass[0])
    // The opponent activates the same zone of their own grid, which is what follows a player being done.
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
    expect(rules.game.rule?.player).toBe(2)
  })

  it('is not offered a second time once it has been hatched this phase', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }], food: 2 * eggCost }))
    hatch(rules, played)
    expect(hatchableCells(rules, 1)).toEqual([])
  })
})

describe('Hatching a Snake', () => {
  it('turns the Egg onto its Snake side and resolves its Hatching effect, then its own effect', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeStealFoodAndMilitary, cell: played }], food: eggCost, opponentFood: 1 }))
    hatch(rules, played)
    expect(snakesInPlay(rules, 1)).toBe(1)
    // Hatching: steal 1 Food, which is the whole of what the opponent had. Effect: gain 1 Military.
    expect(food(rules)).toBe(1)
    expect(food(rules, 2)).toBe(0)
    expect(military(rules)).toBe(1)
  })

  it('counts the Snake that is hatching among the Snakes in play', () => {
    // 1 Snake already out, and the one hatching is the 2nd: the threshold of 2 is reached by the card itself.
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.SnakeSpyAndUpgrade, cell: played }, ...snakesOutside(1)], permanent: outside.slice(1, 2), food: eggCost })
    )
    hatch(rules, played)
    // The Hatching Spy comes first and the Upgrade waits for it, which is the order the card prints them in.
    expect(rules.game.rule?.id).toBe(RuleId.Spy)
    expect(pendingRules(rules)).toContain(RuleId.PendingEffects)
  })

  it('gives nothing but its Hatching effect when its Snake side is under its threshold', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeMilitaryWithThreeSnakes, cell: played }], food: eggCost }))
    hatch(rules, played)
    // 1 Snake in play, the card itself, against the 3 it asks for.
    expect(military(rules)).toBe(0)
  })

  it('gives its Snake side once its owner is at the threshold', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeMilitaryWithThreeSnakes, cell: played }, ...snakesOutside(2)], food: eggCost }))
    hatch(rules, played)
    expect(military(rules)).toBe(2)
  })

  it('resolves its Hatching effect again the next time it is hatched, and only then', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played, snake: true }], food: eggCost }))
    // Already a Snake: there is nothing to hatch, so the 2 Military of its Hatching effect are not given again.
    expect(hatchableCells(rules, 1)).toEqual([])
    activate(rules, played)
    expect(military(rules)).toBe(0)
  })
})

describe('The Snake cards that read the grid', () => {
  it('gives 1 Food for each Egg of its owner', () => {
    const eggs = zone.map((cell) => ({ card: ClanCardId.SnakeMilitary, cell }))
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeDrawAndFoodPerEgg, cell: played }, ...eggs], food: eggCost }))
    hatch(rules, played)
    // 3 Eggs left on the grid: the card itself has hatched, so it is not one of them.
    expect(food(rules)).toBe(3)
    expect(handSize(rules)).toBe(1)
  })

  it('lets its owner play a card of their hand for nothing, an Egg costing exactly the discount', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeDrawPlayCardAndFlipBack, cell: played }], hand: 1, food: eggCost }))
    hatch(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.PlayCard)
    expect(cardDiscount(rules)).toBe(eggCost)
    // Laid outside the zone, and never over the Snake that is offering it: a card covers the square it lands on.
    const play = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))
    const elsewhere = play.find((move) => move.location.parent === index(outside[0]))!
    playAll(rules, elsewhere)
    // Free, so the Food spent hatching is the only Food that has left.
    expect(food(rules)).toBe(0)
    // Then the card asks for a Snake to be turned back onto its Egg side, which is what it is paid with.
    expect(rules.game.rule?.id).toBe(RuleId.FlipSnakeToEgg)
  })
})

describe('The Snake card that turns one of its own back into an Egg', () => {
  it('turns the Snake picked back onto its Egg side', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeDrawPlayCardAndFlipBack, cell: played }], food: eggCost }))
    hatch(rules, played)
    // The card drawn is one this very card offers to play, and turning that down leaves the price to pay.
    expect(rules.game.rule?.id).toBe(RuleId.PlayCard)
    playAll(rules, rules.customMove(CustomMoveType.Pass))
    expect(rules.game.rule?.id).toBe(RuleId.FlipSnakeToEgg)
    const moves = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))
    expect(moves).toHaveLength(1)
    playAll(rules, moves[0])
    expect(snakesInPlay(rules, 1)).toBe(0)
    expect(playedEggs(rules, 1).length).toBe(1)
  })
})

describe('The Snake card that moves an Egg', () => {
  it('swaps the square of the Egg with any other square of the grid, the Egg following its tile', () => {
    const egg = zone[0]
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.SnakeStealFoodAndMoveEgg, cell: played }, { card: ClanCardId.SnakeMilitary, cell: egg }], food: eggCost })
    )
    hatch(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.MoveEgg)
    expect(rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))).toEqual([])
    const moves = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.Tile))
    // The tile of the Egg, to the 15 other squares of the grid.
    expect(moves).toHaveLength(15)
    const eggCard = playedEggs(rules, 1).getIndex()
    const eggTile = rules.material(MaterialType.ClanCard).getItem(eggCard).location.parent!
    const move = moves.find((move) => move.location.x === played.x && move.location.y === played.y)!
    playAll(rules, move)
    // The Egg follows its tile, which now stands where the Snake was, and the Snake went the other way.
    const tiles = rules.material(MaterialType.Tile)
    expect(rules.material(MaterialType.ClanCard).getItem(eggCard).location.parent).toBe(eggTile)
    expect(tiles.getItem(eggTile).location).toMatchObject(played)
    expect(isGridSettled(rules, 1)).toBe(true)
    expect(pendingRules(rules)).toEqual([])
  })

  it('is lost when its owner has no Egg left in play', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeStealFoodAndMoveEgg, cell: played }], food: eggCost }))
    hatch(rules, played)
    expect(rules.game.rule?.id).not.toBe(RuleId.MoveEgg)
  })
})

describe('The Snake card that copies another Snake', () => {
  it('gives what the Snake it reads gives, and leaves that Snake exactly as it stands', () => {
    // 4 Snakes out plus the one hatching: the threshold of 5 is reached, and each of the 4 gives 2 Military.
    const others = snakesOutside(4, ClanCardId.SnakeMilitaryWithThreeSnakes)
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeCopySnake, cell: played }, ...others], food: eggCost }))
    hatch(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.CopySnake)
    // The 4 Snakes of the grid, and never the card doing the copying: reading itself would ask the same again.
    const moves = rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))
    expect(moves).toHaveLength(4)
    playAll(rules, moves[0])
    expect(military(rules)).toBe(2)
    // The Snake that was read is left exactly as it stands, and is still a Snake in play.
    expect(snakesInPlay(rules, 1)).toBe(5)
  })

  it('is never offered a Snake with nothing to give, its Hatching effect being no part of what is copied', () => {
    // 4 SnakeMilitary out, whose 2 Military are printed on their Hatching effect and on nothing else.
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeCopySnake, cell: played }, ...snakesOutside(4)], food: eggCost }))
    hatch(rules, played)
    expect(rules.game.rule?.id).not.toBe(RuleId.CopySnake)
  })

  it('gives nothing at all under its threshold', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeCopySnake, cell: played }, ...snakesOutside(2)], food: eggCost }))
    hatch(rules, played)
    expect(rules.game.rule?.id).not.toBe(RuleId.CopySnake)
  })
})

describe('The victory of the Snakes', () => {
  it('is won on the 7th Snake hatched, and not on the Eggs', () => {
    const six = new LedaRules(game({ cards: snakesOutside(6) }))
    expect(hasSpecialVictory(six, 1)).toBe(false)
    const seven = new LedaRules(game({ cards: [...snakesOutside(6), { card: ClanCardId.SnakeMilitary, cell: played, snake: true }] }))
    expect(hasSpecialVictory(seven, 1)).toBe(true)
  })

  it('counts nothing for a Snake another card has buried', () => {
    const buried = [
      ...snakesOutside(6),
      { card: ClanCardId.SnakeMilitary, cell: played, snake: true },
      { card: ClanCardId.SnakeMilitary, cell: played, snake: true }
    ]
    // 8 Snakes played and 7 squares: the one underneath is out of play, so this is 7 minus 1.
    const rules = new LedaRules(game({ cards: buried }))
    expect(snakesInPlay(rules, 1)).toBe(7)
    expect(hasSpecialVictory(rules, 1)).toBe(true)
  })
})

describe('What an Egg hides', () => {
  it('keeps its front from the opponent and shows it to its owner', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }] }))
    expect(cardFront(rules.getPlayerView(1))).toBe(ClanCardId.SnakeMilitary)
    expect(cardFront(rules.getPlayerView(2))).toBeUndefined()
    // The back is the Egg both of them are looking at, and it is never hidden.
    expect(cardBack(rules.getPlayerView(2))).toBe(Clan.Snake)
  })

  it('hides nothing once the card has hatched', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played, snake: true }] }))
    expect(cardFront(rules.getPlayerView(2))).toBe(ClanCardId.SnakeMilitary)
  })

  it('is priced by both players all the same, an Egg printing its own price', () => {
    const organising = { ...game({ hand: [ClanCardId.SnakeMilitary], food: eggCost }), rule: { id: RuleId.Organisation, player: 1 } }
    // Read on the view of the opponent, where the card in hand is nothing but the back of its clan: they cannot
    // tell which Snake is being played, and they take the 2 Food off all the same.
    const opponentView = new LedaRules(new LedaRules(organising).getPlayerView(2))
    const play = opponentView.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))
    expect(play.length).toBeGreaterThan(0)
    playAll(opponentView, play[0])
    expect(food(opponentView)).toBe(0)
  })
})

const playedCard = (game: MaterialGame<number, MaterialType, LocationType>) =>
  new LedaRules(game).material(MaterialType.ClanCard).location(LocationType.PlayedCard).getItem<ClanCardItemId>()

const cardFront = (game: MaterialGame<number, MaterialType, LocationType>) => playedCard(game)?.id?.front

const cardBack = (game: MaterialGame<number, MaterialType, LocationType>) => playedCard(game)?.id?.back

describe('A Spy spent on an Egg', () => {
  /** The opponent of the Snake player, being asked a Spy in the middle of their own activation. */
  const spying = (setup: Setup): LedaRules =>
    new LedaRules({ ...game(setup), rule: { id: RuleId.Spy, player: 2 } })

  it('is offered on every Egg of the grid across the table, and on none of the player own cards', () => {
    const rules = spying({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }, ...snakesOutside(1)] })
    const looks = rules.getLegalMoves(2).filter(isMoveItemType(MaterialType.ClanCard))
    // The one Egg, and never the hatched Snake beside it, which is face up to everybody already.
    expect(looks).toHaveLength(1)
    expect(looks[0].itemIndex).toBe(0)
  })

  it('turns the Egg over on its own square, for both players, without hatching it', () => {
    const rules = spying({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }] })
    playAll(rules, rules.getLegalMoves(2).filter(isMoveItemType(MaterialType.ClanCard))[0])
    const egg = rules.material(MaterialType.ClanCard).getItem(0)
    expect(egg.location.type).toBe(LocationType.PlayedCard)
    expect(egg.location.parent).toBe(index(played))
    expect(cardFront(rules.getPlayerView(2))).toBe(ClanCardId.SnakeMilitary)
    expect(cardFront(rules.getPlayerView(1))).toBe(ClanCardId.SnakeMilitary)
    // Read, not hatched: it is still an Egg, and counts as no Snake.
    expect(playedEggs(rules, 1).length).toBe(1)
    expect(snakesInPlay(rules, 1)).toBe(0)
  })

  it('turns the Egg back where it lies, and hides it again', () => {
    const rules = spying({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }] })
    playAll(rules, rules.getLegalMoves(2).filter(isMoveItemType(MaterialType.ClanCard))[0])
    // One way back and no choice to make: an Egg is not a pile, so there is no top and no bottom to pick.
    const back = rules.getLegalMoves(2)
    expect(back).toHaveLength(1)
    playAll(rules, back[0])
    const egg = rules.material(MaterialType.ClanCard).getItem(0)
    expect(egg.location.type).toBe(LocationType.PlayedCard)
    expect(egg.location.parent).toBe(index(played))
    expect(cardFront(rules.getPlayerView(2))).toBeUndefined()
  })

  it('is not offered on an Egg already read this round', () => {
    const setup = game({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }, ...snakesOutside(1)] })
    const read = [{ player: 2, pile: MaterialType.ClanCard, egg: 0 }]
    const rules = new LedaRules({ ...setup, rule: { id: RuleId.Spy, player: 2 }, memory: { ...setup.memory, [Memory.Spies]: read } })
    expect(rules.getLegalMoves(2).filter(isMoveItemType(MaterialType.ClanCard)).map((move) => move.itemIndex)).not.toContain(0)
  })

  it('is written down among the Spies of the round, as the card it read', () => {
    const rules = spying({ cards: [{ card: ClanCardId.SnakeMilitary, cell: played }] })
    playAll(rules, rules.getLegalMoves(2).filter(isMoveItemType(MaterialType.ClanCard))[0])
    playAll(rules, rules.getLegalMoves(2)[0])
    expect(roundSpies(rules)).toEqual([{ player: 2, pile: MaterialType.ClanCard, egg: 0 }])
  })
})
