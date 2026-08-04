import { isCustomMoveType, isMoveItemType, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { TileId } from '../material/TileId'
import { catCards } from '../material/clanCards/catCards'
import { CustomMoveType } from './CustomMoveType'
import { pendingRules } from './effects'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/** A card in play, on the square of the zone whose x it is given, and on the face it is showing. */
type Played = { card: ClanCardId; x: number; rotated?: boolean }

type Setup = {
  /** The cards of the player, in the row the zone of the round is set to. */
  cards?: Played[]
  /** The cards of the opponent, in that same row of their own grid. */
  opponentCards?: Played[]
  /** The cards the player holds. Their deck holds every Cat card these and the ones in play leave. */
  hand?: ClanCardId[]
}

/** The 13 cards of the clan, which a player takes as their deck when they pick it (see {@link ChooseClanRule}). */
const allCatCards = Object.keys(catCards).map(Number) as ClanCardId[]

/**
 * A card covers a tile, and names it by its index in the game state rather than by its square: the 16 tiles of
 * the first player come first, then the 16 of their opponent, and the row of the zone is the first of each grid.
 */
const tileIndex = (player: number, x: number) => (player - 1) * 16 + x

const playedCard = (player: number, { card, x, rotated }: Played) => ({
  id: { front: card, back: Clan.Cat },
  location: { type: LocationType.PlayedCard, player, parent: tileIndex(player, x), rotation: rotated }
})

/**
 * A Cat player, their row of the grid holding the cards below. The tiles are permanent Food tiles, so a square
 * with no card on it gives 1 Food: that is what tells a tile being activated from a card being activated.
 */
const game = ({ cards = [], opponentCards = [], hand = [] }: Setup): MaterialGame<number, MaterialType, LocationType> => {
  /**
   * Whatever the hand and the grid do not hold: a clan deck starts whole, and it is that invariant the search of a
   * Ring reads the deck through (see {@link ringsInDeck}).
   */
  const placed = [...hand, ...cards.map(({ card }) => card)]
  const deck = allCatCards.filter((card) => !placed.includes(card))
  return {
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
        { id: Clan.Cat, location: { type: LocationType.PlayerVictoryCondition, player: 1 } },
        { id: Clan.Shark, location: { type: LocationType.PlayerVictoryCondition, player: 2 } }
      ],
      [MaterialType.Tile]: [1, 2].flatMap((player) =>
        [0, 1, 2, 3].flatMap((y) => [0, 1, 2, 3].map((x) => ({ id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player, x, y } })))
      ),
      [MaterialType.ClanCard]: [
        ...cards.map((played) => playedCard(1, played)),
        ...opponentCards.map((played) => playedCard(2, played)),
        ...hand.map((front, x) => ({ id: { front, back: Clan.Cat }, location: { type: LocationType.PlayerHand, player: 1, x } })),
        ...deck.map((front, x) => ({ id: { front, back: Clan.Cat }, location: { type: LocationType.PlayerDeck, player: 1, x } }))
      ],
      [MaterialType.MilitaryVictoryToken]: [{ id: MilitaryVictoryTokenId.Food, location: { type: LocationType.MilitaryVictoryDeck, x: 0 } }]
    }
  }
}

const playAll = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  for (const consequence of rules.play(move)) playAll(rules, consequence)
}

const activate = (rules: LedaRules, x: number) => playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x, y: 0 }))

const military = (rules: LedaRules, player = 1) => rules.game.memory[Memory.MilitarySymbols][player]

const food = (rules: LedaRules) => rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(1).getQuantity()

const hand = (rules: LedaRules) => rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(1)

/** Whether the card played on that square is showing its second face. */
const isRotated = (rules: LedaRules, x: number) =>
  rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(1).parent(x).getItem()!.location.rotation === true

/** The same player and the same material, in the middle of organising their grid rather than activating it. */
const organisation = (setup: Setup): MaterialGame<number, MaterialType, LocationType> => ({
  ...game(setup),
  rule: { id: RuleId.Organisation, player: 1 }
})

/** The moves that play a card of the hand, whichever square each of them lands on. */
const playMoves = (rules: LedaRules) =>
  rules
    .getLegalMoves(1)
    .filter(isMoveItemType(MaterialType.ClanCard))
    .filter((move) => move.location.type === LocationType.PlayedCard)

/** The cards of the hand the player can afford, each offered on all 16 squares of their grid. */
const playableCards = (rules: LedaRules): ClanCardId[] => {
  const cards = rules.material(MaterialType.ClanCard)
  const indexes = new Set(playMoves(rules).map((move) => move.itemIndex))
  return [...indexes].map((index) => cards.getItem(index)!.id.front)
}

/** The card at the far end of the player's deck, which is where a card that is spent is put back. */
const deckBottom = (rules: LedaRules): ClanCardId =>
  rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayerDeck)
    .player(1)
    .getItems()
    .reduce((lowest, card) => (card.location.x! < lowest.location.x! ? card : lowest)).id.front

describe('A Cat card', () => {
  it('gives its first effect, then turns half a turn onto its second', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatMilitaryOrUpgrade, x: 0 }] }))
    activate(rules, 0)
    expect(military(rules)).toBe(2)
    expect(isRotated(rules, 0)).toBe(true)
  })

  it('gives its second effect once turned, and turns back', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatMilitaryOrUpgrade, x: 0, rotated: true }] }))
    activate(rules, 0)
    // The second face upgrades a tile rather than giving Military.
    expect(military(rules)).toBe(0)
    expect(rules.game.rule?.id).toBe(RuleId.UpgradeTile)
    expect(isRotated(rules, 0)).toBe(false)
  })

  it('reads the hand it is activated with, on either face', () => {
    const cards = [{ card: ClanCardId.CatMilitaryOrFoodPerCardInHand, x: 0 }]
    const holding = [ClanCardId.CatDrawAndFood, ClanCardId.CatFoodAndMilitary, ClanCardId.CatSpyAndDraw]
    const first = new LedaRules(game({ cards, hand: holding }))
    activate(first, 0)
    expect(military(first)).toBe(3)

    const second = new LedaRules(game({ cards: [{ ...cards[0], rotated: true }], hand: holding }))
    activate(second, 0)
    expect(food(second)).toBe(3)
  })

  it('leaves its square with nothing to activate while its blank face is up', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatFoodAndMilitary, x: 0, rotated: true }] }))
    // The 3 other squares of the zone, whose tiles are bare.
    expect(rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))).toHaveLength(3)
  })
})

describe('The Cat cards that ask the player something', () => {
  it('activates one of the tiles, without upgrading it', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatUpgradeCardOrActivateTile, x: 0, rotated: true }] }))
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateTile)
    // The 15 bare squares of the grid: the 16th is under the card itself.
    const moves = rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))
    expect(moves).toHaveLength(15)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 3, y: 3 }))
    // A permanent Food tile on its front, activated and left exactly as it was.
    expect(food(rules)).toBe(1)
    const tile = rules.material(MaterialType.Tile).location((location) => location.player === 1 && location.x === 3 && location.y === 3)
    expect(tile.getItem()!.location.rotation).toBeUndefined()
    expect(pendingRules(rules)).toEqual([])
  })

  it('upgrades a tile on its first face', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatUpgradeCardOrActivateTile, x: 0 }] }))
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.UpgradeTile)
  })

  it('takes the Ring the player names out of the deck and into their hand', () => {
    // 3 of the 4 Rings are in hand, so exactly one is left to be worked out as still in the deck.
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatSearchRing, x: 0 }],
        hand: [ClanCardId.CatRingThreeCatCards, ClanCardId.CatRingWinConflictByThree, ClanCardId.CatRingFiveUpgradedTiles]
      })
    )
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.SearchRing)
    // The Ring is named rather than pointed at, its place in the pile being nobody's to know.
    const moves = rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.SearchRing))
    expect(moves.map((move) => move.data)).toEqual([ClanCardId.CatRingEmptyDeck])
    playAll(rules, moves[0])
    expect(
      hand(rules)
        .getItems()
        .map((card) => card.id.front)
    ).toContain(ClanCardId.CatRingEmptyDeck)
    expect(pendingRules(rules)).toEqual([])
  })

  it('offers the same Rings on the client, which cannot read its own deck', () => {
    const state = game({ cards: [{ card: ClanCardId.CatSearchRing, x: 0 }], hand: [ClanCardId.CatRingThreeCatCards] })
    const server = new LedaRules(state)
    activate(server, 0)
    const offered = (rules: LedaRules) =>
      rules
        .getLegalMoves(1)
        .filter(isCustomMoveType(CustomMoveType.SearchRing))
        .map((move) => move.data)
    // The 3 Rings the deck still holds: the 4th is in hand, and counted out by that alone.
    expect(offered(server)).toEqual([ClanCardId.CatRingWinConflictByThree, ClanCardId.CatRingEmptyDeck, ClanCardId.CatRingFiveUpgradedTiles])

    // The same choice from the seat of the player, whose own deck is as hidden to them as to anyone.
    const view = server.getView(1)
    expect(
      view.items[MaterialType.ClanCard]!.filter((card) => card.location.type === LocationType.PlayerDeck).every((card) => card.id?.front === undefined)
    ).toBe(true)
    expect(offered(new LedaRules(view))).toEqual(offered(server))
  })

  it('is lost when the deck holds no Ring', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatSearchRing, x: 0 }],
        hand: [ClanCardId.CatRingEmptyDeck, ClanCardId.CatRingThreeCatCards, ClanCardId.CatRingWinConflictByThree, ClanCardId.CatRingFiveUpgradedTiles]
      })
    )
    activate(rules, 0)
    // All 4 Rings are in hand, so none is left to be worked out as still in the deck.
    expect(rules.game.rule?.id).not.toBe(RuleId.SearchRing)
  })

  it('trades a Ring of the hand for a Military Victory token, or keeps it', () => {
    const setup = { cards: [{ card: ClanCardId.CatSpendRingForToken, x: 0 }], hand: [ClanCardId.CatRingEmptyDeck] }
    const spent = new LedaRules(game(setup))
    activate(spent, 0)
    expect(spent.game.rule?.id).toBe(RuleId.SpendRingForToken)
    const [give] = spent.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))
    playAll(spent, give)
    // The Ring went back under the deck, and the token drawn in its place gave its Food.
    expect(hand(spent).length).toBe(0)
    expect(spent.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(1).length).toBe(1)
    expect(food(spent)).toBe(1)

    const kept = new LedaRules(game(setup))
    activate(kept, 0)
    playAll(kept, kept.customMove(CustomMoveType.Pass, 1))
    expect(hand(kept).length).toBe(1)
    expect(kept.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).length).toBe(0)
  })

  it('copies a card of the opponent in the zone, without touching theirs', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        opponentCards: [{ card: ClanCardId.PandaMilitary, x: 1 }]
      })
    )
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.CopyOpponentCard)
    const moves = rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))
    expect(moves).toHaveLength(1)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    // The 2 Military of their card, gained by the player copying it and not by its owner.
    expect(military(rules, 1)).toBe(2)
    expect(military(rules, 2)).toBe(0)
  })

  it('is lost when the opponent has no card in the zone', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }] }))
    activate(rules, 0)
    expect(rules.game.rule?.id).not.toBe(RuleId.CopyOpponentCard)
  })
})

describe('A Ring', () => {
  it('turns one of the Cat cards in play, without activating it', () => {
    const rules = new LedaRules(
      game({
        cards: [
          { card: ClanCardId.CatRingEmptyDeck, x: 0 },
          { card: ClanCardId.CatFoodAndMilitary, x: 1, rotated: true }
        ]
      })
    )
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.RotateCatCard)
    // The other card, the Ring itself being left out: it prints one effect and no second one.
    const moves = rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.RotateCatCard))
    expect(moves).toHaveLength(1)
    playAll(rules, rules.customMove(CustomMoveType.RotateCatCard, { x: 1, y: 0 }))
    // Turned back onto its first face, and nothing of what that face gives was gained.
    expect(isRotated(rules, 1)).toBe(false)
    expect(food(rules)).toBe(0)
    expect(military(rules)).toBe(0)
  })

  it('may be turned down', () => {
    const rules = new LedaRules(
      game({
        cards: [
          { card: ClanCardId.CatRingEmptyDeck, x: 0 },
          { card: ClanCardId.CatFoodAndMilitary, x: 1, rotated: true }
        ]
      })
    )
    activate(rules, 0)
    playAll(rules, rules.customMove(CustomMoveType.Pass, 1))
    expect(isRotated(rules, 1)).toBe(true)
  })

  it('is never turned over itself when it is activated', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatRingEmptyDeck, x: 0 }] }))
    activate(rules, 0)
    // Nothing else to rotate, so the effect is lost, and the Ring stays on the one face it has.
    expect(isRotated(rules, 0)).toBe(false)
  })
})

/**
 * The 3 Cat cards that are paid with cards of the hand instead of Food. The player owns no Food at all in these,
 * so nothing else of their hand is playable and the price in cards is the only thing being read.
 */
describe('A Cat card paid with cards', () => {
  it('is only offered while the rest of the hand can pay for it', () => {
    // 3 cards for the first, 1 for the last, and 2 cards left in hand once either of them is played.
    const holding = [ClanCardId.CatCopyOpponentCard, ClanCardId.CatUpgradeCardOrActivateTile, ClanCardId.CatFoodAndMilitary]
    const rules = new LedaRules(organisation({ hand: holding }))
    expect(playableCards(rules)).toEqual([ClanCardId.CatUpgradeCardOrActivateTile, ClanCardId.CatFoodAndMilitary])
  })

  it('is paid for once it is played, with cards put under the deck, and the organisation ends', () => {
    const rules = new LedaRules(organisation({ hand: [ClanCardId.CatFoodAndMilitary, ClanCardId.CatDrawAndFood] }))
    playAll(rules, playMoves(rules)[0])
    // The card is on its square, and its price is what its owner is now being asked for.
    expect(rules.game.rule?.id).toBe(RuleId.PayCardCost)
    expect(rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(1).length).toBe(1)

    const [pay] = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))
    playAll(rules, pay)
    expect(hand(rules).length).toBe(0)
    expect(deckBottom(rules)).toBe(ClanCardId.CatDrawAndFood)
    // Nothing is owed any more, and the opponent organises their own grid.
    expect(rules.game.memory[Memory.CardsOwed]).toBeUndefined()
    expect(rules.game.rule).toEqual({ id: RuleId.Organisation, player: 2 })
  })

  it('takes as many cards as it costs, one at a time', () => {
    const holding = [ClanCardId.CatCopyOpponentCard, ClanCardId.CatDrawAndFood, ClanCardId.CatSpyAndDraw, ClanCardId.CatMilitaryOrUpgrade]
    const rules = new LedaRules(organisation({ hand: holding }))
    playAll(rules, playMoves(rules)[0])
    for (const owed of [3, 2, 1]) {
      expect(rules.game.rule?.id).toBe(RuleId.PayCardCost)
      expect(rules.game.memory[Memory.CardsOwed]).toBe(owed)
      playAll(rules, rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))[0])
    }
    expect(hand(rules).length).toBe(0)
    expect(rules.game.rule).toEqual({ id: RuleId.Organisation, player: 2 })
  })

  /** The other moment a card is played: in the middle of an activation, which resumes once the card is paid for. */
  it('is paid for the same way when an effect lets it be played out of turn', () => {
    const state = organisation({ hand: [ClanCardId.CatFoodAndMilitary, ClanCardId.CatDrawAndFood] })
    state.rule = { id: RuleId.PlayCard, player: 1 }
    state.memory[Memory.NextRules] = [RuleId.ActivateZone]
    const rules = new LedaRules(state)
    playAll(rules, playMoves(rules)[0])
    expect(rules.game.rule?.id).toBe(RuleId.PayCardCost)
    playAll(rules, rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))[0])
    expect(hand(rules).length).toBe(0)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateZone)
    expect(pendingRules(rules)).toEqual([])
  })
})
