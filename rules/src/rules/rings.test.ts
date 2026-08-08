import { isCustomMoveType, isMoveItemType, MaterialGame, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId } from '../material/ClanCardId'
import { isRing } from '../material/clanCards/catCards'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { TileId } from '../material/TileId'
import { CustomMoveType } from './CustomMoveType'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * A card of the player in play, on the square of the zone of the round whose x it is given. Showing its blank
 * second face unless the test asks for the first one, which is the one that gives something when activated.
 */
type Played = { card: ClanCardId; x: number; y?: number; rotated?: boolean }

type Setup = {
  /** The cards the player has in play, on the zone of the round, which is the first row of their grid, unless a row of their own is given. */
  cards?: Played[]
  /** The cards they hold, which is where a Ring is played from. */
  hand?: ClanCardId[]
  /** How many cards are left in their deck, which the Blue Ring asks to be none. */
  deck?: number
  /** How many of their permanent tiles show their upgraded face, which the Orange Ring asks for 5 of. */
  upgraded?: number
  /** The military symbols each player gathered, which the conflict of the round compares. */
  symbols?: Record<number, number>
  /** The token the pile is about to hand to the winner of that conflict, and no token at all without one. */
  top?: MilitaryVictoryTokenId
  /** Whether a Scorpion Portal has closed the round to Military Victory tokens. */
  blocked?: boolean
}

/** A card names the tile it covers by its index: the 16 tiles of the player come first, then the 16 of the opponent. */
const tileIndex = (cell: XYCoordinates) => cell.y * 4 + cell.x

/**
 * The 16 tiles of the player. The zone of the round is their first row, and it is laid out so that activating it
 * is one square long: a permanent Food tile on { 0, 0 }, and 3 Deserts, which hold nothing to activate.
 * The rows below are permanent Food tiles, upgraded from the top left as many times as the test asks.
 */
const grid = (upgraded: number) =>
  [0, 1, 2, 3].flatMap((y) =>
    [0, 1, 2, 3].map((x) => {
      if (y === 0) {
        return x === 0
          ? { id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player: 1, x, y } }
          : { id: TileId.TemporaryFood, location: { type: LocationType.PlayerGrid, player: 1, x, y, rotation: true } }
      }
      const rotation = (y - 1) * 4 + x < upgraded ? true : undefined
      return { id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player: 1, x, y, rotation } }
    })
  )

/**
 * Any Cat card with nothing on its second face, played on that face: activating its square gives nothing but the
 * half turn back onto its first one, so a test may hold cards in the zone without gaining anything from them.
 */
const blankCard = ClanCardId.CatFoodAndMilitary

/**
 * A player of the Cats and their opponent, in the middle of activating the first row of their grid. Everything the
 * conditions of the Rings are read on is given by the test: what is in play, what is left in the deck, which tiles
 * are upgraded, and what the conflict of the round is about to settle.
 */
const game = ({ cards = [], hand = [], deck = 0, upgraded = 0, symbols = { 1: 0, 2: 0 }, top, blocked }: Setup): MaterialGame<
  number,
  MaterialType,
  LocationType
> => ({
  players: [1, 2],
  rule: { id: RuleId.ActivateZone, player: 1 },
  memory: {
    [Memory.ActionZone]: ActionZone.Row1,
    [Memory.ActivatedCells]: { 1: [], 2: [] },
    [Memory.MilitarySymbols]: symbols,
    [Memory.MilitaryVictoryBlocked]: blocked,
    [Memory.RoundPlayer]: 1
  },
  items: {
    [MaterialType.VictoryConditionCard]: [
      { id: Clan.Cat, location: { type: LocationType.PlayerVictoryCondition, player: 1 } },
      { id: Clan.Shark, location: { type: LocationType.PlayerVictoryCondition, player: 2 } }
    ],
    [MaterialType.Tile]: [
      ...grid(upgraded),
      ...[0, 1, 2, 3].flatMap((y) => [0, 1, 2, 3].map((x) => ({ id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player: 2, x, y } })))
    ],
    [MaterialType.ClanCard]: [
      // Played on their square showing their blank second face, so that the zone stays one square long to activate.
      ...cards.map(({ card, x, y = 0, rotated = true }) => ({
        id: { front: card, back: Clan.Cat },
        location: { type: LocationType.PlayedCard, player: 1, parent: tileIndex({ x, y }), rotation: rotated }
      })),
      ...hand.map((front, x) => ({ id: { front, back: Clan.Cat }, location: { type: LocationType.PlayerHand, player: 1, x } })),
      ...Array.from({ length: deck }, (_, x) => ({ id: { front: ClanCardId.CatDrawAndFood, back: Clan.Cat }, location: { type: LocationType.PlayerDeck, player: 1, x } }))
    ],
    [MaterialType.MilitaryVictoryToken]: top === undefined ? [] : [{ id: top, location: { type: LocationType.MilitaryVictoryDeck, x: 0 } }]
  }
})

const playAll = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  for (const consequence of rules.play(move)) playAll(rules, consequence)
}

/** The squares of the zone the player may still activate, in whatever order the rule offers them. */
const activableSquares = (rules: LedaRules) =>
  rules.game.rule?.id === RuleId.ActivateZone ? rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare)) : []

/**
 * The player activates their whole zone, which is the one Food tile of the row and whichever cards the test put
 * on it: a card on its blank face is activated too, for the half turn it gives back (see {@link blankCard}).
 */
const endActivation = (rules: LedaRules) => {
  for (let [move] = activableSquares(rules); move !== undefined; [move] = activableSquares(rules)) playAll(rules, move)
}

/**
 * The conflict of the round, whoever the symbols hand it to: the winner takes the top token of the pile, if there
 * is one, and resolves it.
 */
const settleConflict = (rules: LedaRules) => playAll(rules, rules.startRule(RuleId.MilitaryConflict))

/** The Rings the player is being offered, whichever square each of them is offered on. */
const offeredRings = (rules: LedaRules): ClanCardId[] => {
  const cards = rules.material(MaterialType.ClanCard)
  const indexes = new Set(
    rules
      .getLegalMoves(1)
      .filter(isMoveItemType(MaterialType.ClanCard))
      .filter((move) => move.location.type === LocationType.PlayedCard)
      .map((move) => move.itemIndex)
  )
  return [...indexes].map((index) => cards.getItem(index).id.front)
}

/** The move that puts that Ring on that square, which the player has to be offered. */
const placeRing = (rules: LedaRules, ring: ClanCardId, cell: XYCoordinates) => {
  const cards = rules.material(MaterialType.ClanCard)
  const move = rules
    .getLegalMoves(1)
    .filter(isMoveItemType(MaterialType.ClanCard))
    .find((move) => move.location.type === LocationType.PlayedCard && move.location.parent === tileIndex(cell) && cards.getItem(move.itemIndex).id.front === ring)
  expect(move, `${ClanCardId[ring]} is not offered on ${JSON.stringify(cell)}`).toBeDefined()
  playAll(rules, move!)
}

const pass = (rules: LedaRules) => playAll(rules, rules.customMove(CustomMoveType.Pass, 1))

/** The Rings the player has in play, which 3 of win them the game. */
const ringsInPlay = (rules: LedaRules): ClanCardId[] =>
  rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayedCard)
    .player(1)
    .getItems()
    .map((card) => card.id.front)
    .filter(isRing)

describe('The window a Ring is put in play in', () => {
  it('opens once the player is done activating their zone', () => {
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingEmptyDeck] }))
    endActivation(rules)
    expect(rules.game.rule?.id).toBe(RuleId.PlaceRing)
    expect(rules.game.rule?.player).toBe(1)
  })

  it('offers the Ring on all 16 squares of the grid, for free', () => {
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingEmptyDeck] }))
    endActivation(rules)
    const moves = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))
    expect(moves).toHaveLength(16)
    // The player has no Food at all, and pays none: a Ring is put in play rather than bought.
    placeRing(rules, ClanCardId.CatRingEmptyDeck, { x: 3, y: 3 })
    expect(ringsInPlay(rules)).toEqual([ClanCardId.CatRingEmptyDeck])
  })

  it('does not open when no condition is met', () => {
    // The same Ring in hand, and 1 card left in the deck it asks to be empty.
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingEmptyDeck], deck: 1 }))
    endActivation(rules)
    // Phase 1 goes on with the opponent activating the same zone of their own grid.
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
    expect(rules.game.rule?.player).toBe(2)
  })

  it('is turned down as easily as it is taken, free as it is', () => {
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingEmptyDeck] }))
    endActivation(rules)
    expect(rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.Pass))).toHaveLength(1)
    pass(rules)
    expect(ringsInPlay(rules)).toEqual([])
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
    expect(rules.game.rule?.player).toBe(2)
  })

  it('stays open for every other Ring whose condition is met', () => {
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingEmptyDeck, ClanCardId.CatRingFiveUpgradedTiles], upgraded: 5 }))
    endActivation(rules)
    expect(offeredRings(rules).sort()).toEqual([ClanCardId.CatRingEmptyDeck, ClanCardId.CatRingFiveUpgradedTiles])
    // On a square holding none of the 5 upgraded tiles, which putting a Ring on would take out of the count.
    placeRing(rules, ClanCardId.CatRingEmptyDeck, { x: 3, y: 3 })
    // Still the same window, with the second Ring left to put in play.
    expect(rules.game.rule?.id).toBe(RuleId.PlaceRing)
    expect(offeredRings(rules)).toEqual([ClanCardId.CatRingFiveUpgradedTiles])
    placeRing(rules, ClanCardId.CatRingFiveUpgradedTiles, { x: 2, y: 3 })
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
  })

  it('ends the game on the 3rd Ring in play', () => {
    const rules = new LedaRules(
      game({
        cards: [
          { card: ClanCardId.CatRingThreeCatCards, x: 1 },
          { card: ClanCardId.CatRingWinConflictByThree, x: 2 }
        ],
        hand: [ClanCardId.CatRingEmptyDeck]
      })
    )
    endActivation(rules)
    placeRing(rules, ClanCardId.CatRingEmptyDeck, { x: 3, y: 3 })
    expect(rules.isOver()).toBe(true)
    expect(rules.rankPlayers(1, 2)).toBeLessThan(0)
  })
})

describe('The Blue Ring', () => {
  it('is put in play on an empty deck', () => {
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingEmptyDeck], deck: 0 }))
    endActivation(rules)
    expect(offeredRings(rules)).toEqual([ClanCardId.CatRingEmptyDeck])
  })

  it('is put in play on a deck the activation itself empties', () => {
    // The last card of the deck is drawn by the very square the player ends their zone on: the deck is empty by
    // the time they are done activating, which is when the window is opened.
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatDrawAndFood, x: 1, rotated: false }], hand: [ClanCardId.CatRingEmptyDeck], deck: 1 }))
    endActivation(rules)
    expect(rules.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(1)).toHaveLength(0)
    expect(offeredRings(rules)).toEqual([ClanCardId.CatRingEmptyDeck])
  })

  it('is not offered while one card is left to draw', () => {
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingEmptyDeck], deck: 1 }))
    endActivation(rules)
    expect(rules.game.rule?.id).not.toBe(RuleId.PlaceRing)
  })
})

describe('The Purple Ring', () => {
  const cards = [1, 2, 3].map((x) => ({ card: blankCard, x }))

  it('is put in play on a zone holding 3 Cat cards', () => {
    const rules = new LedaRules(game({ cards, hand: [ClanCardId.CatRingThreeCatCards], deck: 1 }))
    endActivation(rules)
    expect(offeredRings(rules)).toEqual([ClanCardId.CatRingThreeCatCards])
  })

  it('is not offered on a zone holding 2 of them', () => {
    const rules = new LedaRules(game({ cards: cards.slice(0, 2), hand: [ClanCardId.CatRingThreeCatCards], deck: 1 }))
    endActivation(rules)
    expect(rules.game.rule?.id).not.toBe(RuleId.PlaceRing)
  })
})

describe('The Orange Ring', () => {
  it('is put in play with 5 upgraded tiles', () => {
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingFiveUpgradedTiles], deck: 1, upgraded: 5 }))
    endActivation(rules)
    expect(offeredRings(rules)).toEqual([ClanCardId.CatRingFiveUpgradedTiles])
  })

  it('is not offered with 4 of them', () => {
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingFiveUpgradedTiles], deck: 1, upgraded: 4 }))
    endActivation(rules)
    expect(rules.game.rule?.id).not.toBe(RuleId.PlaceRing)
  })

  it('does not count an upgraded tile a card covers', () => {
    // 5 tiles turned over, the first of them under a card: what that square shows is the card, and the tile below
    // it counts no more than it gives, which leaves 4 upgraded tiles on the table.
    const covered = { card: blankCard, x: 0, y: 1 }
    const rules = new LedaRules(game({ cards: [covered], hand: [ClanCardId.CatRingFiveUpgradedTiles], deck: 1, upgraded: 5 }))
    endActivation(rules)
    expect(rules.game.rule?.id).not.toBe(RuleId.PlaceRing)
    // The same grid with a 6th tile turned over is back to 5 the player can see, and the Ring is offered again.
    const more = new LedaRules(game({ cards: [covered], hand: [ClanCardId.CatRingFiveUpgradedTiles], deck: 1, upgraded: 6 }))
    endActivation(more)
    expect(offeredRings(more)).toEqual([ClanCardId.CatRingFiveUpgradedTiles])
  })
})

describe('The Red Ring', () => {
  const setup = (symbols: Record<number, number>, top?: MilitaryVictoryTokenId): Setup => ({
    hand: [ClanCardId.CatRingWinConflictByThree],
    deck: 1,
    symbols,
    top
  })

  it('is put in play on a conflict won by 3 symbols, once the token is won', () => {
    const rules = new LedaRules(game(setup({ 1: 3, 2: 0 }, MilitaryVictoryTokenId.Victory)))
    settleConflict(rules)
    expect(rules.game.rule?.id).toBe(RuleId.PlaceRing)
    // The token is already in front of its winner: the Ring is put in play on the conflict, not instead of it.
    expect(rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(1)).toHaveLength(1)
    expect(offeredRings(rules)).toEqual([ClanCardId.CatRingWinConflictByThree])
    placeRing(rules, ClanCardId.CatRingWinConflictByThree, { x: 3, y: 3 })
    // Phase 3 follows, which is what the conflict was holding.
    expect(rules.game.rule?.id).toBe(RuleId.Organisation)
  })

  it('is not offered at the end of an activation, whatever the symbols already gathered', () => {
    // The active player of the round activates first, so a lead over an opponent who has not played yet is a lead
    // over nothing: it is the conflict that is won by 3 symbols, and it is not settled here.
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingWinConflictByThree], deck: 1, symbols: { 1: 3, 2: 0 } }))
    endActivation(rules)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
    expect(rules.game.rule?.player).toBe(2)
  })

  it.each([
    { 1: 1, 2: 0 },
    { 1: 2, 2: 0 },
    { 1: 3, 2: 1 },
    { 1: 5, 2: 3 }
  ])('is not offered on a conflict won by less than 3 symbols (%j)', (symbols) => {
    const rules = new LedaRules(game(setup(symbols, MilitaryVictoryTokenId.Victory)))
    settleConflict(rules)
    expect(rules.game.rule?.id).toBe(RuleId.Organisation)
  })

  it('reads the lead over the opponent and not the symbols gathered', () => {
    const rules = new LedaRules(game(setup({ 1: 4, 2: 2 }, MilitaryVictoryTokenId.Victory)))
    settleConflict(rules)
    expect(rules.game.rule?.id).toBe(RuleId.Organisation)
  })

  it('stays in hand on a round a Scorpion Portal closed to Military Victory tokens', () => {
    // Nobody may win one, so the conflict has no winner at all and there is no conflict won by 3 symbols.
    const rules = new LedaRules(game({ ...setup({ 1: 3, 2: 0 }, MilitaryVictoryTokenId.Victory), blocked: true }))
    settleConflict(rules)
    expect(rules.game.rule?.id).toBe(RuleId.Organisation)
  })

  it('stays in hand when the pile of Military Victory tokens has run out', () => {
    const rules = new LedaRules(game(setup({ 1: 3, 2: 0 })))
    settleConflict(rules)
    expect(rules.game.rule?.id).toBe(RuleId.Organisation)
  })

  it('is not offered to the player who lost the conflict', () => {
    const rules = new LedaRules(game(setup({ 1: 0, 2: 3 }, MilitaryVictoryTokenId.Victory)))
    settleConflict(rules)
    expect(rules.game.rule?.id).toBe(RuleId.Organisation)
  })

  it('opens no window on a Military Victory token a card draws outside of a conflict', () => {
    // The Blue Ring is playable, and the token is drawn in the middle of phase 1, which settles no conflict.
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingEmptyDeck], top: MilitaryVictoryTokenId.Victory }))
    playAll(rules, rules.startPlayerTurn(RuleId.MilitaryVictory, 1))
    expect(rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(1)).toHaveLength(1)
    expect(rules.game.rule?.id).not.toBe(RuleId.PlaceRing)
  })

  it('is alone in its window, the 3 other Rings belonging to the activation', () => {
    // Both conditions are met, and only the one of phase 2 is answered there.
    const rules = new LedaRules(game({ hand: [ClanCardId.CatRingWinConflictByThree, ClanCardId.CatRingEmptyDeck], symbols: { 1: 3, 2: 0 }, top: MilitaryVictoryTokenId.Victory }))
    settleConflict(rules)
    expect(offeredRings(rules)).toEqual([ClanCardId.CatRingWinConflictByThree])
  })
})
