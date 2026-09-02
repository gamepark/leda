import { isCustomMoveType, isMoveItemType, MaterialGame, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { ClanCardId } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { sameCell } from '../material/PlayerGrid'
import { TileId } from '../material/TileId'
import { CustomMoveType } from './CustomMoveType'
import { pendingRules } from './effects'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { sharkTokens } from './sharkPack'

type Setup = {
  /** The cards in play, one per square of the grid. */
  cards?: { card: ClanCardId; cell: XYCoordinates }[]
  /** The squares that hold a Shark token, cards or not. */
  tokens?: XYCoordinates[]
  /** The Military Victory tokens their owner has already won. */
  won?: MilitaryVictoryTokenId[]
  /** The squares whose tile is a permanent one rather than a Desert. */
  permanent?: XYCoordinates[]
}

const index = ({ x, y }: XYCoordinates) => y * 4 + x

/**
 * A Shark player, their grid covered with Deserts so that nothing but the cards gives anything, and the zone of
 * the round set on row 1, which is where the cards below are played.
 */
const game = ({ cards = [], tokens = [], won = [], permanent = [] }: Setup): MaterialGame<number, MaterialType, LocationType> => ({
  players: [1, 2],
  rule: { id: RuleId.ActivateZone, player: 1 },
  memory: {
    [Memory.ActionZone]: ActionZone.Row1,
    [Memory.ActivatedCells]: { 1: [], 2: [] },
    // The opponent wins the military conflict that follows, so that the token it hands out is never ours to count.
    [Memory.MilitarySymbols]: { 1: 0, 2: 5 },
    [Memory.RoundPlayer]: 2
  },
  items: {
    [MaterialType.VictoryConditionCard]: [{ id: Clan.Shark, location: { type: LocationType.PlayerVictoryCondition, player: 1 } }],
    [MaterialType.Tile]: [0, 1, 2, 3].flatMap((y) =>
      [0, 1, 2, 3].map((x) =>
        permanent.some((cell) => cell.x === x && cell.y === y)
          ? { id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player: 1, x, y } }
          : { id: TileId.TemporaryFood, location: { type: LocationType.PlayerGrid, player: 1, x, y, rotation: true } }
      )
    ),
    [MaterialType.ClanCard]: [
      ...cards.map(({ card, cell }) => ({ id: { front: card, back: Clan.Shark }, location: { type: LocationType.PlayedCard, player: 1, parent: index(cell) } })),
      { id: { back: Clan.Shark }, location: { type: LocationType.PlayerDeck, player: 1, x: 0 } }
    ],
    [MaterialType.SharkToken]: [
      { location: { type: LocationType.PlayerSharkSupply, player: 1 }, quantity: sharkTokens - tokens.length },
      ...tokens.map((cell) => ({ location: { type: LocationType.PlacedSharkToken, player: 1, parent: index(cell) }, quantity: 1 }))
    ],
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

const military = (rules: LedaRules) => rules.game.memory[Memory.MilitarySymbols][1]

const food = (rules: LedaRules) => rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(1).getQuantity()

const middle = { x: 1, y: 0 }
/** The 2 squares on either side of {@link middle}, which are what wakes its Pack up. */
const around = [
  { x: 0, y: 0 },
  { x: 2, y: 0 }
]

describe('A Shark card', () => {
  it('gives its normal effect while its Pack is asleep', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SharkMilitary, cell: middle }], tokens: [middle] }))
    activate(rules, middle)
    expect(military(rules)).toBe(1)
  })

  it('gives its Pack effect instead while 2 tokens surround its square', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SharkMilitary, cell: middle }], tokens: [middle, ...around] }))
    activate(rules, middle)
    expect(military(rules)).toBe(2)
  })

  it('reads its square when what it gives is counted on the board', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SharkMilitaryPerToken, cell: middle }], tokens: [middle, ...around, { x: 1, y: 1 }] }))
    activate(rules, middle)
    // 1 Military per orthogonally adjacent token: the 2 beside it and the one under it, its own not counting.
    expect(military(rules)).toBe(3)
  })

  it('reads what its owner has won when that is what it counts', () => {
    const won = [MilitaryVictoryTokenId.Victory, MilitaryVictoryTokenId.Victory, MilitaryVictoryTokenId.Victory]
    const asleep = new LedaRules(game({ cards: [{ card: ClanCardId.SharkFoodPerToken, cell: middle }], tokens: [middle], won }))
    activate(asleep, middle)
    expect(food(asleep)).toBe(1) // 1 Food per pair of tokens owned.
    const awake = new LedaRules(game({ cards: [{ card: ClanCardId.SharkFoodPerToken, cell: middle }], tokens: [middle, ...around], won }))
    activate(awake, middle)
    expect(food(awake)).toBe(3) // 1 Food per token owned.
  })
})

describe('The Pack effects that ask the player something', () => {
  it('places a Shark token on one of the tiles that have none', () => {
    const rules = new LedaRules(game({ cards: [{ card: ClanCardId.SharkPackPlaceToken, cell: middle }], tokens: [middle, ...around] }))
    activate(rules, middle)
    expect(rules.game.rule?.id).toBe(RuleId.PlaceSharkToken)
    const moves = rules.getLegalMoves(1).filter(isMoveItemType(MaterialType.SharkToken))
    // The 13 squares of the grid that have no token yet.
    expect(moves).toHaveLength(13)
    playAll(rules, moves[0])
    expect(rules.material(MaterialType.SharkToken).location(LocationType.PlacedSharkToken).length).toBe(4)
    expect(pendingRules(rules)).toEqual([])
  })

  it('puts a Military Victory token back under the pile and draws a new one', () => {
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.SharkPackRedrawToken, cell: middle }], tokens: [middle, ...around], won: [MilitaryVictoryTokenId.Draw] })
    )
    activate(rules, middle)
    expect(rules.game.rule?.id).toBe(RuleId.RedrawMilitaryVictory)
    playAll(rules, rules.getLegalMoves(1)[0])
    // The token traded went under the pile, and the one drawn in its place gives 1 Food.
    const owned = rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(1).getItems()
    expect(owned).toHaveLength(1)
    expect(owned[0].id).toBe(MilitaryVictoryTokenId.Food)
    expect(food(rules)).toBe(1)
  })

  it('triggers a Military Victory token already won, which stays where it is', () => {
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.SharkSpyOrTriggerToken, cell: middle }], tokens: [middle, ...around], won: [MilitaryVictoryTokenId.Food] })
    )
    activate(rules, middle)
    expect(military(rules)).toBe(1)
    expect(rules.game.rule?.id).toBe(RuleId.TriggerMilitaryVictory)
    playAll(rules, rules.getLegalMoves(1).find(isCustomMoveType(CustomMoveType.TriggerMilitaryVictory))!)
    expect(food(rules)).toBe(1)
    expect(rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(1).length).toBe(1)
  })

  it('activates a tile out of turn, and upgrades that same tile', () => {
    const upgraded = { x: 3, y: 3 }
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.SharkUpgrade, cell: middle }], tokens: [middle, ...around], permanent: [upgraded] })
    )
    activate(rules, middle)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateAndUpgradeTile)
    // The 15 bare squares of the grid: the tile of the card that asked is under it, and out of reach.
    const cells = rules.getLegalMoves(1).filter(isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare))
    expect(cells).toHaveLength(15)
    expect(cells.some((move) => sameCell(move.data!, middle))).toBe(false)
    playAll(rules, rules.customMove(CustomMoveType.ActivateSquare, upgraded))
    // The Food tile gave its Food, and was turned onto its upgraded face right after.
    expect(food(rules)).toBe(1)
    expect(rules.material(MaterialType.Tile).getItem(index(upgraded)).location.rotation).toBe(true)
    expect(pendingRules(rules)).toEqual([])
  })
})

describe('Nothing is activated twice during one activation phase', () => {
  it('leaves a Shark card no tile the zone has already been through', () => {
    // A permanent tile of the zone, which its owner activates before the card that asks for a tile.
    const permanent = { x: 0, y: 0 }
    const rules = new LedaRules(
      game({ cards: [{ card: ClanCardId.SharkUpgrade, cell: middle }], tokens: [middle, ...around], permanent: [permanent] })
    )
    activate(rules, permanent)
    expect(food(rules)).toBe(1)
    activate(rules, middle)
    expect(rules.game.rule?.id).toBe(RuleId.ActivateAndUpgradeTile)
    // 15 bare squares, minus the one already activated: the card cannot have that tile give a second time.
    const cells = rules.getLegalMoves(1).filter(isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare))
    expect(cells).toHaveLength(14)
    expect(cells.some((move) => sameCell(move.data!, permanent))).toBe(false)
  })
})
