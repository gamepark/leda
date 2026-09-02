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
import { activableCells, isCellLeftToActivate, lockedCells } from './activation'
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

/** A card in play, several on one square piling up in the order they are given, the last one on top. */
type Played = { card: ClanCardId; cell: XYCoordinates }

type Setup = {
  /** The cards in play, one per square of the grid unless a test piles them up. */
  cards?: Played[]
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
  /** The cards the opponent has in play, which cover the tiles of their squares as the ones of the player do. */
  opponentCards?: Played[]
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
 * The cards of one player in play, each numbered by how high it stands on its square: the engine numbers them
 * that way as they are played, and several cards on one square pile up in the order they are given here
 * (see {@link squares}).
 */
const playedCards = (cards: Played[], player: number, clan: Clan, offset = 0) => {
  const heights: Record<number, number> = {}
  return cards.map(({ card, cell }) => {
    const parent = offset + index(cell)
    heights[parent] = (heights[parent] ?? -1) + 1
    return { id: { front: card, back: clan }, location: { type: LocationType.PlayedCard, player, parent, z: heights[parent] } }
  })
}

/**
 * A Scorpion player, their grid covered with Deserts so that nothing but the cards gives anything, and the zone
 * of the round set on row 1, which is where the cards below are played.
 * The opponent has a grid of their own, since one of the Portals has them turn one of its tiles over.
 */
const game = ({ cards = [], squares = [], won = [], hand = 0, food = 0, opponentSquares = [], opponentCards = [] }: Setup): MaterialGame<
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
      { id: Clan.Scorpion, location: { type: LocationType.PlayerVictoryCondition, player: 1 } },
      { id: Clan.Cat, location: { type: LocationType.PlayerVictoryCondition, player: 2 } }
    ],
    [MaterialType.Tile]: [...grid(1, squares), ...grid(2, opponentSquares)],
    [MaterialType.ClanCard]: [
      ...playedCards(cards, 1, Clan.Scorpion),
      // The 16 tiles of the player come first in the grid, so a square of the opponent is 16 tiles further on.
      ...playedCards(opponentCards, 2, Clan.Cat, 16),
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

  it('leaves out a tile another card covers, which is no tile to turn over', () => {
    const permanent = elsewhere[0]
    const rules = new LedaRules(
      game({
        cards: [
          { card: ClanCardId.ScorpionUpgradeAndActivate, cell: played },
          // The one permanent tile of the grid is under a card, and a card covers the tile of its square: what is
          // hidden is not turned over, so there is nothing left to upgrade at all.
          { card: ClanCardId.ScorpionDrawAndFood, cell: permanent }
        ],
        squares: [{ cell: permanent, square: 'permanent' }]
      })
    )
    activate(rules, played)
    expect(rules.game.rule?.id).not.toBe(RuleId.UpgradeAndActivateTile)
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

  /** The 2 moves of a Spy: the top of a pile looked at, then put back where it was. */
  const spy = (rules: LedaRules) => {
    playAll(rules, rules.getLegalMoves(1)[0])
    playAll(rules, rules.getLegalMoves(1)[0])
  }

  it('adds a Spy with 1 Portal, the Military with 2, and a Desert to activate with 3', () => {
    const one = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodAndPortalBonus, cell: played }, ...portalsInPlay(1)] }))
    activate(one, played)
    expect(one.game.rule?.id).toBe(RuleId.Spy)
    expect(military(one)).toBe(0)

    // The card reads "1 Food, then Spy, then 1 Military, then activate a Desert", and is resolved in that order:
    // what comes after the Spy is given once it has been answered (see {@link PendingEffectsRule}).
    const two = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodAndPortalBonus, cell: played }, ...portalsInPlay(2)] }))
    activate(two, played)
    expect(military(two)).toBe(0)
    expect(pendingRules(two)).toContain(RuleId.ActivateZone)
    spy(two)
    expect(military(two)).toBe(1)

    const three = new LedaRules(game({ cards: [{ card: ClanCardId.ScorpionFoodAndPortalBonus, cell: played }, ...portalsInPlay(3)] }))
    activate(three, played)
    spy(three)
    expect(military(three)).toBe(1)
    expect(three.game.rule?.id).toBe(RuleId.ActivateDesert)
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

  it('reaches none of the tiles the opponent has under a card', () => {
    const upgraded = { x: 0, y: 0 }
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.ScorpionPortalFlipOpponentTile, cell: played }],
        // The one tile of theirs that is not on its worse face already, and a card of their own played over it.
        opponentSquares: [{ cell: upgraded, square: 'upgraded' }],
        opponentCards: [{ card: ClanCardId.CatFoodAndMilitary, cell: upgraded }]
      })
    )
    activate(rules, played)
    // Nothing of theirs is showing a face they could lose, so they are never asked and the tile keeps its own.
    expect(rules.game.rule?.id).not.toBe(RuleId.DowngradeTile)
    const tile = rules.material(MaterialType.Tile).location((location) => location.player === 2 && location.x === upgraded.x && location.y === upgraded.y)
    expect(tile.getItem()!.location.rotation).toBe(true)
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
    // A square of the zone the opponent has to activate, which is what the table keeps shining on while the
    // player goes through their own grid, and stops shining on while the swap is asked.
    const opponentCell = { x: 1, y: 0 }
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.ScorpionPortalSwap, cell: played }], opponentSquares: [{ cell: opponentCell, square: 'permanent' }] })
    )
    // Nothing to swap while the zone is simply being activated, and what is left to activate shines in both grids.
    expect(swappingPlayer(rules)).toBeUndefined()
    expect(isCellLeftToActivate(rules, 1, played)).toBe(true)
    expect(isCellLeftToActivate(rules, 2, opponentCell)).toBe(true)
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.SwapSquares)
    expect(swappingPlayer(rules)).toBe(1)
    // The zone stops shining while the swap is asked: the 4 squares of it are not what is being pointed at.
    expect(isCellLeftToActivate(rules, 2, opponentCell)).toBe(false)
    // And once the swap is made, the activation goes on where it was, the opponent still having their grid to do.
    playAll(rules, rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.Tile))[0])
    expect(swappingPlayer(rules)).toBeUndefined()
    expect(isCellLeftToActivate(rules, 2, opponentCell)).toBe(true)
    // The square the player has activated is done with, and stops shining rather than shining until the phase ends.
    expect(isCellLeftToActivate(rules, 1, played)).toBe(false)
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

  it('counts none of the upgraded tiles a card covers', () => {
    const upgraded = elsewhere.slice(0, 2).map((cell) => ({ cell, square: 'upgraded' as const }))
    // One of the 2 under a card, which leaves 1 upgraded tile on the table and 1 Food more to pay.
    const covered = [{ card: ClanCardId.ScorpionDrawAndFood, cell: elsewhere[0] }]
    expect(price(ClanCardId.ScorpionPortalFlipOpponentTile, { squares: upgraded, cards: covered })).toBe(8)
  })

  it('costs 9 minus the Portals its owner has already played', () => {
    expect(price(ClanCardId.ScorpionPortalSwap)).toBe(9)
    const inPlay = [ClanCardId.ScorpionPortalDoubleSpy, ClanCardId.ScorpionPortalBlockMilitaryVictory].map((card, position) => ({
      card,
      cell: elsewhere[position]
    }))
    expect(price(ClanCardId.ScorpionPortalSwap, { cards: inPlay })).toBe(7)
  })

  it('counts none of the Portals another card covers', () => {
    // The 2 Portals in play again, the second of them buried under a card played on its square afterwards: a
    // Portal nobody can see is out of play, and it is no more counted here than by the victory it is played for.
    const inPlay = [
      { card: ClanCardId.ScorpionPortalDoubleSpy, cell: elsewhere[0] },
      { card: ClanCardId.ScorpionPortalBlockMilitaryVictory, cell: elsewhere[1] },
      { card: ClanCardId.ScorpionDrawAndFood, cell: elsewhere[1] }
    ]
    expect(price(ClanCardId.ScorpionPortalSwap, { cards: inPlay })).toBe(8)
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

describe('Nothing is activated twice during one activation phase', () => {
  /** A square of the zone the tests activate before the card, so that what it holds has already given. */
  const first = { x: 1, y: 0 }
  /** Another square of the zone, left holding a Desert, which a swap can carry the first one onto. */
  const fresh = { x: 2, y: 0 }
  /** The last square of the zone, so that the phase has somewhere to go once the card is done. */
  const last = { x: 3, y: 0 }

  it('bars a tile a Portal swap carries onto a square of the zone nobody has been through', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.ScorpionPortalSwap, cell: played }],
        squares: [
          { cell: first, square: 'permanent' },
          { cell: last, square: 'temporary' }
        ]
      })
    )
    activate(rules, first)
    expect(food(rules)).toBe(1)
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.SwapSquares)
    const tile = rules.material(MaterialType.Tile).location((location) => location.player === 1 && location.x === first.x && location.y === first.y)
    playAll(rules, tile.moveItem((item) => ({ ...item.location, ...fresh })))
    // The square is fresh, the tile standing on it is not: what is left of the zone is the temporary tile alone.
    expect(activableCells(rules, 1)).toEqual([last])
    activate(rules, last)
    expect(food(rules)).toBe(2)
  })

  it('bars the Desert a temporary tile has just become from being read again', () => {
    const temporary = { cell: first, square: 'temporary' as const }
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.ScorpionActivateDesert, cell: played }],
        // Every other square is permanent, so the Desert this tile becomes is the only one that could be read.
        squares: [...noBareDesert.filter(({ cell }) => cell.x !== first.x || cell.y !== first.y), temporary]
      })
    )
    activate(rules, first)
    expect(food(rules)).toBe(1)
    activate(rules, played)
    // The one Desert on the table is the tile that has just given: the card finds nothing to read and is lost.
    expect(rules.game.rule?.id).not.toBe(RuleId.ActivateDesert)
    expect(food(rules)).toBe(1)
  })

  it('still upgrades a tile it has been through, and loses the activation that follows', () => {
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.ScorpionUpgradeAndActivate, cell: played }], squares: [{ cell: first, square: 'permanent' }] })
    )
    activate(rules, first)
    expect(food(rules)).toBe(1)
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.UpgradeAndActivateTile)
    // The tile is still offered: what this card asks for is an upgrade, and upgrading is not activating.
    const moves = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.Tile))
    expect(moves).toHaveLength(1)
    playAll(rules, moves[0])
    expect(rules.material(MaterialType.Tile).getItem(index(first)).location.rotation).toBe(true)
    // Its upgraded face would have given 2 Food: the second half of the card is lost, and the first one stands.
    expect(food(rules)).toBe(1)
  })
})

/**
 * A lock stands where the rule waiting would be offering a square and is not, and nowhere else: it answers the
 * question a player is asking at that moment, and not the whole story of their grid (see {@link lockedCells}).
 */
describe('The lock a square carries', () => {
  const first = { x: 1, y: 0 }
  const fresh = { x: 2, y: 0 }
  const last = { x: 3, y: 0 }

  const swapGame = () =>
    new LedaRules(
      game({
        cards: [{ card: ClanCardId.ScorpionPortalSwap, cell: played }],
        squares: [
          { cell: first, square: 'permanent' },
          { cell: last, square: 'temporary' }
        ]
      })
    )

  it('is nowhere while a player simply goes through their zone', () => {
    const rules = swapGame()
    activate(rules, first)
    // The square is done for the round, so the zone is not offering it and has nothing to explain about it.
    expect(lockedCells(rules, 1)).toEqual([])
  })

  it('stands on the square a swap carried something already activated onto', () => {
    const rules = swapGame()
    activate(rules, first)
    activate(rules, played)
    const tile = rules.material(MaterialType.Tile).location((location) => location.player === 1 && location.x === first.x && location.y === first.y)
    playAll(rules, tile.moveItem((item) => ({ ...item.location, ...fresh })))
    // The zone would be offering that square: it is the tile standing on it, and it alone, that bars it.
    expect(lockedCells(rules, 1)).toEqual([fresh])
  })

  it('is nowhere in the grid of the player who is not being asked', () => {
    const rules = swapGame()
    activate(rules, first)
    activate(rules, played)
    const tile = rules.material(MaterialType.Tile).location((location) => location.player === 1 && location.x === first.x && location.y === first.y)
    playAll(rules, tile.moveItem((item) => ({ ...item.location, ...fresh })))
    expect(lockedCells(rules, 2)).toEqual([])
  })

  it('stands beside the button of the tile a Scorpion card upgrades but can no longer activate', () => {
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.ScorpionUpgradeAndActivate, cell: played }], squares: [{ cell: first, square: 'permanent' }] })
    )
    activate(rules, first)
    activate(rules, played)
    expect(rules.game.rule?.id).toBe(RuleId.UpgradeAndActivateTile)
    // The upgrade is still offered on that very square, and the lock says what will not follow it.
    expect(rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.Tile))).toHaveLength(1)
    expect(lockedCells(rules, 1)).toEqual([first])
  })
})
