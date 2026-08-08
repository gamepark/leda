import { getEnumValues, isCustomMoveType, isMoveItemType, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId, clanOf } from '../material/ClanCardId'
import { hasHalfTurn } from '../material/Effect'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { cellOf, tileAt } from '../material/PlayerGrid'
import { TileId } from '../material/TileId'
import { clanCardEffects } from '../material/clanCards/cardProperties'
import { catCards } from '../material/clanCards/catCards'
import { CustomMoveType } from './CustomMoveType'
import { pendingRules } from './effects'
import { Memory } from './Memory'
import { rotateCard, rotateCardOn } from './playedCards'
import { RuleId } from './RuleId'
import { putBackMoves } from './spy'

/** A card in play, on the square of the zone whose x it is given, and on the face it is showing. */
type Played = { card: ClanCardId; x: number; rotated?: boolean }

type Setup = {
  /** The cards of the player, in the row the zone of the round is set to. */
  cards?: Played[]
  /** The cards of the opponent, in that same row of their own grid. */
  opponentCards?: Played[]
  /** The cards the player holds. Their deck holds every Cat card these and the ones in play leave. */
  hand?: ClanCardId[]
  /** What the 16 tiles of a grid are, for the tests the permanent Food tile of every grid will not do for. */
  tiles?: Grid
  opponentTiles?: Grid
  /** The squares of the row of the opponent holding a Shark token, which is what wakes a Pack (see {@link sharkPack}). */
  opponentSharkTokens?: number[]
}

/** The 16 tiles of a grid, all the same and all on the same face: a Desert is a temporary tile turned over. */
type Grid = { tile: TileId; flipped?: boolean }

const permanentFood: Grid = { tile: TileId.PermanentFood }

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
const game = ({
  cards = [],
  opponentCards = [],
  hand = [],
  tiles = permanentFood,
  opponentTiles = permanentFood,
  opponentSharkTokens = []
}: Setup): MaterialGame<number, MaterialType, LocationType> => {
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
      [MaterialType.Tile]: [1, 2].flatMap((player) => {
        const grid = player === 1 ? tiles : opponentTiles
        return [0, 1, 2, 3].flatMap((y) =>
          [0, 1, 2, 3].map((x) => ({
            id: grid.tile,
            location: { type: LocationType.PlayerGrid, player, x, y, rotation: grid.flipped ? true : undefined }
          }))
        )
      }),
      [MaterialType.ClanCard]: [
        ...cards.map((played) => playedCard(1, played)),
        ...opponentCards.map((played) => playedCard(2, played)),
        ...hand.map((front, x) => ({ id: { front, back: Clan.Cat }, location: { type: LocationType.PlayerHand, player: 1, x } })),
        ...deck.map((front, x) => ({ id: { front, back: Clan.Cat }, location: { type: LocationType.PlayerDeck, player: 1, x } }))
      ],
      [MaterialType.MilitaryVictoryToken]: [{ id: MilitaryVictoryTokenId.Food, location: { type: LocationType.MilitaryVictoryDeck, x: 0 } }],
      [MaterialType.SharkToken]: opponentSharkTokens.map((x) => ({
        location: { type: LocationType.PlacedSharkToken, player: 2, parent: tileIndex(2, x) }
      }))
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
    // The half turn is printed after the Upgrade, so it is taken after it: the card is still showing the face
    // being resolved for as long as the player is being asked which tile it upgrades.
    expect(isRotated(rules, 0)).toBe(true)
    playAll(rules, rules.getLegalMoves(1)[0])
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

  it('is worth activating on its blank face, for the half turn that face gives', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatFoodAndMilitary, x: 0, rotated: true }] }))
    // All 4 squares of the zone: the blank face gives its half turn and nothing else, which is enough.
    expect(rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))).toHaveLength(4)
    activate(rules, 0)
    expect(food(rules)).toBe(0)
    expect(military(rules)).toBe(0)
    // Back onto its first face, ready to give it next round.
    expect(isRotated(rules, 0)).toBe(false)
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

  it('copies a card of the opponent in the zone, its owner gaining nothing from it', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        opponentCards: [{ card: ClanCardId.PandaMilitary, x: 1 }]
      })
    )
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.CopyOpponentCard)
    // All 4 squares of their row: their card, and the 3 tiles the rest of the zone is bare of any card.
    const moves = rules.getLegalMoves(1).filter(isCustomMoveType(CustomMoveType.ActivateSquare))
    expect(moves).toHaveLength(4)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    // The 2 Military of their card, gained by the player copying it and not by its owner.
    expect(military(rules, 1)).toBe(2)
    expect(military(rules, 2)).toBe(0)
    // The card that copied takes the half turn it prints, exactly as it would have on any other face: what it
    // copies replaces the copy and nothing else of what the card gives.
    expect(isRotated(rules, 0)).toBe(true)
  })

  it('never copies a half turn, no clan but this one printing any', () => {
    // What the copy is resolved on is the card that copied it, so a copied half turn would turn that card a
    // second time and undo its own (see {@link CopyOpponentCardRule}). It cannot happen: the 2 players hold 2
    // different clans, and only the Cats print one. Pinned here rather than argued, since a card added to any
    // other sheet would break the copy silently.
    const turning = getEnumValues(ClanCardId).filter((card) => [false, true].some((second) => hasHalfTurn(clanCardEffects(card, second))))
    expect(turning.every((card) => clanOf(card) === Clan.Cat)).toBe(true)
  })

  /** The face the tile of that square of the opponent is showing, a temporary tile turned over being a Desert. */
  const isOpponentTileFlipped = (rules: LedaRules, x: number) =>
    tileAt(rules.material(MaterialType.Tile), 2, { x, y: 0 }).getItem()!.location.rotation === true

  it('copies a bare square of theirs, which is the tile of that square, and leaves that tile untouched', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        opponentTiles: { tile: TileId.TemporaryMilitary }
      })
    )
    activate(rules, 0)
    expect(rules.game.rule?.id).toBe(RuleId.CopyOpponentCard)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    // The Military their tile gives, gained here and not by them, their tile staying on its front: nothing of
    // theirs is spent, so a temporary tile copied does not become the Desert activating it would have made of it.
    expect(military(rules, 1)).toBe(1)
    expect(military(rules, 2)).toBe(0)
    expect(isOpponentTileFlipped(rules, 1)).toBe(false)
  })

  it('reads the face the tile of theirs is showing, an upgraded tile giving what that face gives', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        opponentTiles: { tile: TileId.PermanentFood, flipped: true }
      })
    )
    activate(rules, 0)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    expect(food(rules)).toBe(2)
  })

  it('reads what it copies against the player copying, a card counting Deserts counting theirs', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        // 16 Deserts on this side, and none on the other: what a copy counts is what the copying player owns.
        tiles: { tile: TileId.TemporaryFood, flipped: true },
        opponentCards: [{ card: ClanCardId.ScorpionFoodPerDesertPair, x: 1 }]
      })
    )
    activate(rules, 0)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    // 15 Deserts in sight, the 16th being under the card itself, hence 7 pairs and 7 Food. Their own grid holds
    // none, so a card read on their side would have given nothing at all.
    expect(food(rules)).toBe(7)
  })

  it('copies the Shark card that counts the tokens around it, and finds none around itself', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        opponentCards: [{ card: ClanCardId.SharkMilitaryPerToken, x: 1 }],
        // One token on their card and one on each side of it: 2 around the square, so their Pack is awake and it
        // is the face counting tokens that is up, worth 3 Military to them.
        opponentSharkTokens: [0, 1, 2]
      })
    )
    activate(rules, 0)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    // That awake face is what is copied, and it counts the tokens around the card resolving it: a Cat card, in a
    // grid holding no Shark token at all, hence nothing.
    expect(military(rules, 1)).toBe(0)
    expect(military(rules, 2)).toBe(0)

    // The same card with its Pack asleep, to show the 0 above is the Pack face being read and not a copy that
    // failed: its printed face gives 2 Military, and those 2 are copied.
    const asleep = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        opponentCards: [{ card: ClanCardId.SharkMilitaryPerToken, x: 1 }]
      })
    )
    activate(asleep, 0)
    playAll(asleep, asleep.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    expect(military(asleep, 1)).toBe(2)
  })

  it('copies a Special activation square of theirs, which is worth the clan of the player copying', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        opponentTiles: { tile: TileId.TemporarySpecialActivation }
      })
    )
    const before = hand(rules).length
    activate(rules, 0)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    // The crystal of the Cats, which is 1 card drawn, and not the 2 Military their Shark opponent reads it as.
    expect(hand(rules).length).toBe(before + 1)
    expect(military(rules, 1)).toBe(0)
  })

  /** The card the player would draw next, which is the very card a Spy on their own deck looks at. */
  const deckTop = (rules: LedaRules): ClanCardId =>
    rules.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(1).deck().limit(1).getItem()!.id.front

  it('Spies before it draws, the card drawn being the one the Spy leaves on top', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatSpyAndDraw, x: 0 }] }))
    const looked = deckTop(rules)
    activate(rules, 0)
    // The Spy comes first, and nothing is drawn until it has been answered: a card drawn ahead of it would be the
    // very card the player is about to look at, and the Spy would have nothing left to decide.
    expect(rules.game.rule?.id).toBe(RuleId.Spy)
    expect(hand(rules).length).toBe(0)

    // Into their own deck, and the card looked at goes back under it rather than on top.
    const [look] = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.ClanCard))
    playAll(rules, look)
    playAll(rules, putBackMoves(rules, 1)!.under)

    // The draw took whatever the Spy left on top, which is no longer the card that was looked at.
    expect(hand(rules).length).toBe(1)
    expect(hand(rules).getItem()!.id.front).not.toBe(looked)
    expect(deckBottom(rules)).toBe(looked)
    // And the half turn the card gives comes last, once the whole of it has been given.
    expect(isRotated(rules, 0)).toBe(true)
    expect(pendingRules(rules)).toEqual([])
  })

  it('takes its half turn on itself, wherever a swap it copied has left it', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        opponentCards: [{ card: ClanCardId.ScorpionPortalSwap, x: 1 }]
      })
    )
    activate(rules, 0)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, { x: 1, y: 0 }))
    // The Portal copied asks the player to swap 2 of their own squares, and the half turn the card still owes
    // waits for that answer, being printed after the copy.
    expect(rules.game.rule?.id).toBe(RuleId.SwapSquares)
    const [swap] = rules
      .getLegalMoves(1)
      .filter(isMoveItemType(MaterialType.Tile))
      .filter((move) => move.itemIndex === tileIndex(1, 0) && move.location.x === 3 && move.location.y === 3)
    playAll(rules, swap)

    // The card is in the far corner it was sent to, and it is that card that turned: a half turn turns whatever
    // gave it, and not whatever is standing on the square it was activated on by the time it is taken.
    const card = rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).player(1).getItem()!
    expect(cellOf(rules.material(MaterialType.Tile).getItem(card.location.parent!).location)).toEqual({ x: 3, y: 3 })
    expect(card.location.rotation).toBe(true)
  })

  it('is lost when the opponent has nothing to activate in the zone', () => {
    const rules = new LedaRules(
      game({
        cards: [{ card: ClanCardId.CatCopyOpponentCard, x: 0 }],
        // A grid of Deserts, with no card over any of them: there is nothing of theirs to copy in the zone.
        opponentTiles: { tile: TileId.TemporaryFood, flipped: true }
      })
    )
    activate(rules, 0)
    expect(rules.game.rule?.id).not.toBe(RuleId.CopyOpponentCard)
  })
})

describe('A half turn', () => {
  it('turns nothing on a square that has no face to turn onto', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.CatRingEmptyDeck, x: 0 }] }))
    // A Ring, which prints one effect and no second one, and a bare square, which holds no card at all. A half
    // turn reaching either of them is worth nothing, the way becoming a Desert is worth nothing to a card: what
    // is turned is asked of what it reaches, never assumed of whoever sent the half turn there.
    expect(rotateCardOn(rules, 1, { x: 0, y: 0 })).toHaveLength(0)
    expect(rotateCardOn(rules, 1, { x: 1, y: 0 })).toHaveLength(0)
    // A tile is no more turned over than a Ring is: only a card ever has a second face.
    expect(rotateCard(rules, { type: MaterialType.Tile, index: 0 })).toHaveLength(0)
    // The same square once a card that does alternate 2 faces stands on it, to show the 3 above are the guard
    // and not a square nothing can reach.
    const turning = new LedaRules(game({ cards: [{ card: ClanCardId.CatFoodAndMilitary, x: 0 }] }))
    expect(rotateCardOn(turning, 1, { x: 0, y: 0 })).toHaveLength(1)
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
