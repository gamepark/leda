import { isMoveItemType, MaterialGame, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { TileId } from '../material/TileId'
import { isCellOfActivatedZone } from './activation'
import { CustomMoveType } from './CustomMoveType'
import { cardDiscount, pendingRules } from './effects'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { swappingPlayer } from './swap'

/**
 * What every square of a grid holds when the test does not say otherwise: a Desert, which gives nothing when the
 * zone is activated and everything the Scorpions read the grid for.
 */
type Square =
  /** A temporary tile already activated, showing the back that reminds what its front gives. */
  | 'desert'
  /** A temporary tile on its front, which the zone can still activate. */
  | 'temporary'
  /** A permanent tile on its front, which an Upgrade can turn over. */
  | 'permanent'
  /** A permanent tile already upgraded. */
  | 'upgraded'

type Setup = {
  /** The cards in play, one per square of the grid. */
  cards?: { card: ClanCardId; cell: XYCoordinates }[]
  /** The squares that hold something else than a Desert. */
  squares?: { cell: XYCoordinates; square: Square }[]
  /** The Military Victory tokens their owner has already won, which is what one of the Portals is priced on. */
  won?: MilitaryVictoryTokenId[]
  /**
   * The cards the player holds: which ones when a test is about to play one of them, or simply how many, the
   * price of one of the Portals being read off the hand it is still part of.
   */
  hand?: ClanCardId[] | number
  /** The Food the player owns, which is what they pay the cards they play with. */
  food?: number
  /** The squares of the opponent that hold something else than a Desert. */
  opponentSquares?: { cell: XYCoordinates; square: Square }[]
}

const index = ({ x, y }: XYCoordinates) => y * 4 + x

const tileOf = (square: Square, player: number, x: number, y: number) => {
  const location = { type: LocationType.PlayerGrid, player, x, y }
  switch (square) {
    case 'desert':
      return { id: TileId.TemporaryFood, location: { ...location, rotation: true } }
    case 'temporary':
      return { id: TileId.TemporaryFood, location }
    case 'permanent':
      return { id: TileId.PermanentFood, location }
    case 'upgraded':
      return { id: TileId.PermanentFood, location: { ...location, rotation: true } }
  }
}

const grid = (player: number, squares: { cell: XYCoordinates; square: Square }[]) =>
  [0, 1, 2, 3].flatMap((y) =>
    [0, 1, 2, 3].map((x) => tileOf(squares.find(({ cell }) => cell.x === x && cell.y === y)?.square ?? 'desert', player, x, y))
  )

/** A hand given as a number is that many cards worth nothing in particular, which any card of the clan is. */
const handOf = (hand: ClanCardId[] | number): ClanCardId[] =>
  typeof hand === 'number' ? Array.from({ length: hand }, () => ClanCardId.ScorpionDrawAndFood) : hand

/**
 * A Scorpion player, their grid covered with Deserts so that nothing but the cards gives anything, and the zone
 * of the round set on row 1, which is where the cards below are played.
 * The opponent has a grid of their own, since one of the Portals has them turn one of its tiles over.
 */
const game = ({ cards = [], squares = [], won = [], hand = 0, food = 0, opponentSquares = [] }: Setup): MaterialGame<number, MaterialType, LocationType> => ({
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
      { id: Clan.Scorpion, location: { type: LocationType.PlayerVictoryCondition, player: 1 } },
      { id: Clan.Cat, location: { type: LocationType.PlayerVictoryCondition, player: 2 } }
    ],
    [MaterialType.Tile]: [...grid(1, squares), ...grid(2, opponentSquares)],
    [MaterialType.ClanCard]: [
      ...cards.map(({ card, cell }) => ({
        id: { front: card, back: Clan.Scorpion },
        location: { type: LocationType.PlayedCard, player: 1, parent: index(cell) }
      })),
      ...handOf(hand).map((front, x) => ({ id: { front, back: Clan.Scorpion }, location: { type: LocationType.PlayerHand, player: 1, x } })),
      { id: { back: Clan.Scorpion }, location: { type: LocationType.PlayerDeck, player: 1, x: 0 } }
    ],
    [MaterialType.FoodToken]: food > 0 ? [{ location: { type: LocationType.PlayerFood, player: 1 }, quantity: food }] : [],
    [MaterialType.MilitaryVictoryToken]: [
      ...won.map((id, x) => ({ id, location: { type: LocationType.PlayerMilitaryVictory, player: 1, x } })),
      { id: MilitaryVictoryTokenId.Food, location: { type: LocationType.MilitaryVictoryDeck, x: 0 } }
    ]
  }
})

const playAll = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  for (const consequence of rules.play(move)) playAll(rules, consequence)
}

const activate = (rules: LedaRules, cell: XYCoordinates) => playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, cell))

const military = (rules: LedaRules, player = 1) => rules.game.memory[Memory.MilitarySymbols][player]

const food = (rules: LedaRules) => rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(1).getQuantity()

const handSize = (rules: LedaRules) => rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(1).length

/** The square the cards below are played on, in the row the zone of the round is set to. */
const played = { x: 0, y: 0 }

/**
 * The 15 other squares of the grid, the ones the tests fill. The 4 of row 1 are in the zone of the round, so
 * anything but a Desert put there is one more square the player will be asked to activate: the tests that only
 * need a tile somewhere use {@link elsewhere}, which starts below the zone.
 */
const otherCells = [0, 1, 2, 3].flatMap((y) => [0, 1, 2, 3].map((x) => ({ x, y }))).filter((cell) => cell.x !== played.x || cell.y !== played.y)

const elsewhere = otherCells.filter((cell) => cell.y > 0)

/** Squares that are not Deserts, so that a test can say how many Deserts are left rather than count them out. */
const notDeserts = (count: number) => elsewhere.slice(0, count).map((cell) => ({ cell, square: 'permanent' as const }))

/** Every square but the one the card is on turned into something else, leaving that covered Desert alone. */
const noBareDesert = otherCells.map((cell) => ({ cell, square: 'permanent' as const }))

describe('The Scorpion cards that read the Deserts of their owner', () => {
  it('gives 1 Food per pair of Deserts', () => {
    // 16 squares, 5 of them permanent, so 11 Deserts, 1 of which is under the card itself: 10 on the table, 5 pairs.
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodPerDesertPair, cell: played }], squares: notDeserts(5) }))
    activate(rules, played)
    expect(food(rules)).toBe(5)
  })

  it('gives 1 Military per pair of Deserts', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionMilitaryPerDesertPair, cell: played }], squares: notDeserts(6) }))
    activate(rules, played)
    // 10 Deserts, 1 of them under the card: 9 on the table, so 4 pairs and one left over.
    expect(military(rules)).toBe(4)
  })

  it('counts the Deserts on the table and not the ones under a card', () => {
    // 3 bare Deserts, and a 4th under the card itself: a Desert nobody can see is a Desert nobody counts, so this
    // is 1 pair and not 2.
    const bare = elsewhere.slice(0, 3)
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.ScorpionFoodPerDesertPair, cell: played }],
        squares: noBareDesert.filter(({ cell }) => !bare.some((desert) => desert.x === cell.x && desert.y === cell.y))
      })
    )
    activate(rules, played)
    expect(food(rules)).toBe(1)
  })

  it('counts nothing when every Desert of the grid is covered', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodPerDesertPair, cell: played }], squares: noBareDesert }))
    activate(rules, played)
    expect(food(rules)).toBe(0)
  })

  it('discounts the card it lets its owner play by 1 Food per pair of Deserts', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionDiscountPerDesertPair, cell: played }], squares: notDeserts(5), hand: 1 }))
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.PlayCard)
    expect(cardDiscount(rules)).toBe(5)
  })

  it('draws and gains, which reads nothing at all', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionDrawAndFood, cell: played }] }))
    activate(rules, played)
    expect(food(rules)).toBe(1)
    expect(handSize(rules)).toBe(1)
  })
})

describe('The Scorpion card that activates a Desert', () => {
  it('is lost when every Desert of the grid is covered by a card', () => {
    // The one Desert left is the square the card itself is on, and a card covers the tile of its square.
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionActivateDesert, cell: played }], squares: noBareDesert }))
    activate(rules, played)
    expect(rules.game.rule?.id).not.toBe(RuleId.ActivateDesert)
  })

  it('gives what the Desert reminds, and leaves it a Desert', () => {
    // One bare Desert on the grid, everything else permanent, so the choice can only be that square.
    const desert = elsewhere[elsewhere.length - 1]
    const withDesert = new LedaRules(
      game({
        cards: [{ card: ClanCardId.ScorpionActivateDesert, cell: played }],
        squares: noBareDesert.filter(({ cell }) => cell.x !== desert.x || cell.y !== desert.y)
      })
    )
    activate(withDesert, played)
    expect(withDesert.game.rule?.id).toBe(RuleId.ActivateDesert)
    expect(withDesert.getLegalMoves(1)).toHaveLength(1)
    playAll(withDesert, withDesert.customMove(CustomMoveType.ActivateSquare, desert))
    // The front of a TemporaryFood tile, which is what its Desert side reminds.
    expect(food(withDesert)).toBe(1)
    const tile = withDesert.material(MaterialType.Tile).location((location) => location.player === 1 && location.x === desert.x && location.y === desert.y)
    expect(tile.getItem()!.location.rotation).toBe(true)
    expect(pendingRules(withDesert)).toEqual([])
  })
})

describe('The Scorpion card that upgrades and activates', () => {
  it('activates the face the tile shows once it is upgraded', () => {
    const permanent = elsewhere[0]
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.ScorpionUpgradeAndActivate, cell: played }], squares: [{ cell: permanent, square: 'permanent' }] })
    )
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.UpgradeAndActivateTile)
    const moves = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.Tile))
    expect(moves).toHaveLength(1)
    playAll(rules, moves[0])
    // The upgraded face of a PermanentFood tile gives 2 Food, where its front gives 1.
    expect(food(rules)).toBe(2)
    expect(pendingRules(rules)).toEqual([])
  })

  it('is lost whole when nothing can be upgraded, activation included', () => {
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.ScorpionUpgradeAndActivate, cell: played }], squares: [{ cell: elsewhere[0], square: 'upgraded' }] })
    )
    activate(rules, played)
    // The one permanent tile of the grid is upgraded already, so there is nothing to pick and the player is never
    // asked: unlike the Shark card, which activates any bare tile and only loses the upgrade half of what it gives,
    // this one has a single tile to pick for both halves, and loses both.
    expect(rules.game.rule?.id).not.toBe(RuleId.UpgradeAndActivateTile)
    // That upgraded tile would have given 2 Food had it been activated on its own.
    expect(food(rules)).toBe(0)
  })
})

describe('The Scorpion card that scales with the Portals in play', () => {
  const portalsInPlay = (count: number) =>
    [ClanCardId.ScorpionPortalDoubleSpy, ClanCardId.ScorpionPortalSwap, ClanCardId.ScorpionPortalFlipOpponentTile]
      .slice(0, count)
      .map((card, position) => ({ card, cell: elsewhere[position] }))

  it('gives the Food alone while no Portal is in play', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodAndPortalBonus, cell: played }] }))
    activate(rules, played)
    expect(food(rules)).toBe(1)
    expect(military(rules)).toBe(0)
    expect(rules.game.rule?.id).not.toBe(RuleId.Spy)
  })

  it('adds a Spy with 1 Portal, the Military with 2, and a Desert to activate with 3', () => {
    const one = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodAndPortalBonus, cell: played }, ...portalsInPlay(1)] }))
    activate(one, played)
    expect(one.game.rule?.id).toBe(RuleId.Spy)
    expect(military(one)).toBe(0)

    const two = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodAndPortalBonus, cell: played }, ...portalsInPlay(2)] }))
    activate(two, played)
    expect(military(two)).toBe(1)
    expect(pendingRules(two)).toContain(RuleId.ActivateZone)

    const three = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodAndPortalBonus, cell: played }, ...portalsInPlay(3)] }))
    activate(three, played)
    expect(military(three)).toBe(1)
    expect(pendingRules(three)).toContain(RuleId.ActivateDesert)
  })
})

describe('The Scorpion Portals', () => {
  it('spies twice, and never twice on the same pile', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionPortalDoubleSpy, cell: played }], hand: 2 }))
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.Spy)
    // The 3 piles: the deck of the player, the Action tiles, and the Military Victory tokens. The Action tiles
    // are down to none here, and the Military Victory pile to its last token, which is still worth a look.
    const first = rules.getLegalMoves(1)
    expect(first).toHaveLength(2)
    playAll(rules, first[0])
    playAll(rules, rules.getLegalMoves(1)[0])
    // The second Spy of the same card cannot go back to the pile the first one used.
    expect(rules.game.rule?.id).toBe(RuleId.Spy)
    const second = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))
    expect(second).toHaveLength(0)
    expect(rules.getLegalMoves(1)).toHaveLength(1)
  })

  it('has the opponent turn one of their own tiles over, then gives the turn back', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.ScorpionPortalFlipOpponentTile, cell: played }],
        // One more square to activate in the zone, so that the player still has something to do when they get
        // the turn back: with nothing left, the round would move on to the opponent and hide the hand over.
        squares: [{ cell: { x: 1, y: 0 }, square: 'temporary' }],
        opponentSquares: [{ cell: { x: 0, y: 0 }, square: 'upgraded' }]
      })
    )
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.DowngradeTile)
    // The choice belongs to the opponent, and only to them.
    expect(rules.game.rule?.player).toBe(2)
    expect(rules.getLegalMoves(1)).toHaveLength(0)
    // The 15 Deserts of the opponent are already on their worse face: only the upgraded tile can be turned over.
    const moves = rules.getLegalMoves(2).filter(isMoveItemType(MaterialType.Tile))
    expect(moves).toHaveLength(1)
    playAll(rules, moves[0])
    const flipped = rules.material(MaterialType.Tile).location((location) => location.player === 2 && location.x === 0 && location.y === 0)
    expect(flipped.getItem()!.location.rotation).toBe(false)
    // The game goes back to the player whose card it was.
    expect(rules.game.rule?.player).toBe(1)
  })

  it('is lost when the opponent has nothing to turn over', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionPortalFlipOpponentTile, cell: played }] }))
    activate(rules, played)
    // Every tile of the opponent is a Desert already: the turn never leaves the player.
    expect(rules.game.rule?.player).toBe(1)
    expect(rules.game.rule?.id).not.toBe(RuleId.DowngradeTile)
  })

  it('swaps 2 squares of its owner, with what is played on them', () => {
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.ScorpionPortalSwap, cell: played }], squares: [{ cell: elsewhere[0], square: 'permanent' }] })
    )
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.SwapSquares)
    const moves = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.Tile))
    // Every tile of the grid to every other square.
    expect(moves).toHaveLength(16 * 15)
    const permanent = rules.material(MaterialType.Tile).location((location) => location.player === 1 && location.x === elsewhere[0].x && location.y === elsewhere[0].y)
    const [permanentIndex] = permanent.getIndexes()
    playAll(rules, permanent.moveItem((tile) => ({ ...tile.location, x: 3, y: 3 })))
    const moved = rules.material(MaterialType.Tile).getItem(permanentIndex).location
    expect({ x: moved.x, y: moved.y }).toEqual({ x: 3, y: 3 })
    // The tile that was there took the square the permanent one left, and nothing is left standing on two.
    const corner = rules.material(MaterialType.Tile).location((location) => location.player === 1 && location.x === elsewhere[0].x && location.y === elsewhere[0].y)
    expect(corner.length).toBe(1)
    expect(pendingRules(rules)).toEqual([])
  })

  /**
   * What the table reads to let a tile be taken from under the cards played on it, and to shine on the squares
   * that may be moved rather than on the zone being activated (see {@link swappingPlayer}).
   */
  it('has the table offer the whole grid of its owner while it asks', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionPortalSwap, cell: played }] }))
    // Nothing to swap while the zone is simply being activated, and the zone shines.
    expect(swappingPlayer(rules)).toBeUndefined()
    expect(isCellOfActivatedZone(rules, played)).toBe(true)
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.SwapSquares)
    expect(swappingPlayer(rules)).toBe(1)
    // The zone stops shining while the swap is asked: the 4 squares of it are not what is being pointed at.
    expect(isCellOfActivatedZone(rules, played)).toBe(false)
    // And once the swap is made, the activation goes on where it was.
    playAll(rules, rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.Tile))[0])
    expect(swappingPlayer(rules)).toBeUndefined()
    expect(isCellOfActivatedZone(rules, played)).toBe(true)
  })

  it('closes the round to Military Victory tokens, for both players', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionPortalBlockMilitaryVictory, cell: played }] }))
    // The player wins the conflict of the round, and still takes no token.
    rules.game.memory[Memory.MilitarySymbols] = { 1: 5, 2: 0 }
    activate(rules, played)
    expect(rules.game.memory[Memory.MilitaryVictoryBlocked]).toBe(true)
    playAll(rules, rules.startRule(RuleId.MilitaryConflict))
    expect(rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).length).toBe(0)
  })
})

/**
 * Every Portal costs 9 Food minus a counter of its own, so that the win condition of the Scorpions gets cheaper
 * the further along its owner is. What each of them counts is read off the game while the card is still in hand.
 */
describe('The price of a Scorpion Portal', () => {
  /** The same player and the same material, organising their grid rather than activating it. */
  const organisation = (setup: Setup): MaterialGame<number, MaterialType, LocationType> => ({
    ...game(setup),
    rule: { id: RuleId.Organisation, player: 1 }
  })

  /** The moves that play that card of the hand, which are the 16 squares of the grid or nothing at all. */
  const playMoves = (rules: LedaRules, card: ClanCardId) => {
    const cards = rules.material(MaterialType.ClanCard)
    return rules
      .getLegalMoves(1)
      .filter(isMoveItemType(MaterialType.ClanCard))
      .filter((move) => move.location.type === LocationType.PlayedCard && cards.getItem(move.itemIndex).id.front === card)
  }

  /**
   * What the card is worth, read the way a player reads it: the least Food they can own and still be offered to
   * play it. 10 when nothing under 10 Food buys it, which no price of the game ever is.
   */
  const price = (card: ClanCardId, setup: Setup = {}, others = 0): number => {
    const hand = [card, ...handOf(others)]
    for (let food = 0; food <= 9; food++) {
      if (playMoves(new LedaRules(organisation({ ...setup, hand, food })), card).length > 0) return food
    }
    return 10
  }

  it('costs 9 minus the cards of the hand it is still part of', () => {
    // Alone in hand, the card being counted before it is played and not after.
    expect(price(ClanCardId.ScorpionPortalDoubleSpy)).toBe(8)
    expect(price(ClanCardId.ScorpionPortalDoubleSpy, {}, 2)).toBe(6)
  })

  it('costs 9 minus the upgraded tiles of its owner', () => {
    // A grid of Deserts, which are turned over too and count for nothing: only an upgraded permanent tile does.
    expect(price(ClanCardId.ScorpionPortalFlipOpponentTile)).toBe(9)
    const upgraded = elsewhere.slice(0, 2).map((cell) => ({ cell, square: 'upgraded' as const }))
    expect(price(ClanCardId.ScorpionPortalFlipOpponentTile, { squares: upgraded })).toBe(7)
  })

  it('costs 9 minus the Portals its owner has already played', () => {
    expect(price(ClanCardId.ScorpionPortalSwap)).toBe(9)
    const inPlay = [ClanCardId.ScorpionPortalDoubleSpy, ClanCardId.ScorpionPortalBlockMilitaryVictory].map((card, position) => ({
      card,
      cell: elsewhere[position]
    }))
    expect(price(ClanCardId.ScorpionPortalSwap, { cards: inPlay })).toBe(7)
  })

  it('costs 9 minus the Military Victory tokens its owner has won', () => {
    expect(price(ClanCardId.ScorpionPortalBlockMilitaryVictory)).toBe(9)
    const won = [MilitaryVictoryTokenId.Food, MilitaryVictoryTokenId.Food, MilitaryVictoryTokenId.Food]
    expect(price(ClanCardId.ScorpionPortalBlockMilitaryVictory, { won })).toBe(6)
  })

  it('is free rather than owed once its counter has passed 9', () => {
    // 10 cards in hand, the Portal included, which would price it at -1.
    expect(price(ClanCardId.ScorpionPortalDoubleSpy, {}, 9)).toBe(0)
  })

  it('is paid for out of the Food of its owner as it is played', () => {
    const rules = new LedaRules(organisation({ hand: [ClanCardId.ScorpionPortalDoubleSpy], food: 9 }))
    playAll(rules, playMoves(rules, ClanCardId.ScorpionPortalDoubleSpy)[0])
    // 8 Food for a Portal alone in hand, and the organisation of the player is over.
    expect(food(rules)).toBe(1)
    expect(rules.game.rule).toEqual({ id: RuleId.Organisation, player: 2 })
  })
})
