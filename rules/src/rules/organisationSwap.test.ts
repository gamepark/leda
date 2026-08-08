import { isMoveItemType, MaterialGame, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ActionZone } from '../material/ActionZone'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { TileId } from '../material/TileId'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { roundSwaps, swapOnTile } from './swap'

/**
 * What a swap made while organising leaves behind until the end of the round, so that a player who was watching
 * their own side of the table can read back which 2 squares of the grid opposite are not what they were
 * (see {@link Memory.OrganisationSwaps} and {@link SwapHistoryButton}).
 */

const index = ({ x, y }: XYCoordinates) => y * 4 + x

/** A grid of 16 tiles, addressed in reading order, which is the order the items are created in. */
const grid = (player: number) =>
  [0, 1, 2, 3].flatMap((y) => [0, 1, 2, 3].map((x) => ({ id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player, x, y } })))

/** Both players with a grid of their own, the first of them organising theirs, which is the end of the round. */
const game = (rule = RuleId.Organisation): MaterialGame<number, MaterialType, LocationType> => ({
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
      { id: Clan.Scorpion, location: { type: LocationType.PlayerVictoryCondition, player: 1 } },
      { id: Clan.Cat, location: { type: LocationType.PlayerVictoryCondition, player: 2 } }
    ],
    [MaterialType.Tile]: [...grid(1), ...grid(2)],
    [MaterialType.ClanCard]: [{ id: { back: Clan.Scorpion }, location: { type: LocationType.PlayerDeck, player: 1, x: 0 } }],
    [MaterialType.ActionTile]: [{ location: { type: LocationType.ActionTileDeck, x: 0 } }]
  }
})

const playAll = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  for (const consequence of rules.play(move)) playAll(rules, consequence)
}

const from = { x: 0, y: 0 }
const to = { x: 3, y: 2 }

/** The swap of a grid: taking the tile of one square onto another, which sends the tile that was there back. */
const swap = (rules: LedaRules) =>
  playAll(
    rules,
    rules
      .material(MaterialType.Tile)
      .index(index(from))
      .moveItem((tile) => ({ ...tile.location, ...to }))
  )

describe('A swap made while organising a grid', () => {
  it('is written down, as the 2 squares that changed places', () => {
    const rules = new LedaRules(game())
    expect(roundSwaps(rules)).toEqual([])
    swap(rules)
    expect(roundSwaps(rules)).toEqual([{ player: 1, cells: [from, to] }])
  })

  it('is read back off both squares of the grid it was made in, and off no other', () => {
    const rules = new LedaRules(game())
    swap(rules)
    // The tile of the first square is on the second one now, and the tile it sent back is where it came from.
    expect(swapOnTile(rules, index(from))?.player).toBe(1)
    expect(swapOnTile(rules, index(to))?.player).toBe(1)
    expect(swapOnTile(rules, index({ x: 1, y: 1 }))).toBeUndefined()
    // The same squares in the grid of the opponent, which nothing happened to.
    expect(swapOnTile(rules, 16 + index(from))).toBeUndefined()
    expect(swapOnTile(rules, 16 + index(to))).toBeUndefined()
  })

  it('is forgotten when the next round starts', () => {
    const rules = new LedaRules(game())
    swap(rules)
    playAll(rules, rules.startPlayerTurn(RuleId.ChooseAction, 2))
    expect(roundSwaps(rules)).toEqual([])
    expect(swapOnTile(rules, index(to))).toBeUndefined()
  })

  /** A Portal is played in the middle of an activation everyone is already watching (see {@link SwapSquaresRule}). */
  it('is not written down when a Scorpion Portal is the one asking', () => {
    const rules = new LedaRules(game(RuleId.SwapSquares))
    swap(rules)
    expect(roundSwaps(rules)).toEqual([])
  })
})

/** The tile a swap moves keeps everything of it but its square, which is what makes the record readable. */
describe('The 2 halves of a swap', () => {
  it('leave one tile on each of the 2 squares', () => {
    const rules = new LedaRules(game())
    swap(rules)
    const tiles = rules.material(MaterialType.Tile).location(LocationType.PlayerGrid).player(1)
    expect(tiles.location((location) => location.x === to.x && location.y === to.y).getIndexes()).toEqual([index(from)])
    expect(tiles.location((location) => location.x === from.x && location.y === from.y).getIndexes()).toEqual([index(to)])
  })

  it('are the only tile moves of the organisation, and the Food follows them', () => {
    const rules = new LedaRules(game())
    swap(rules)
    expect(rules.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(1).getQuantity()).toBe(1)
    // The organisation of the player is over, and their opponent organises their own grid.
    expect(rules.game.rule).toEqual({ id: RuleId.Organisation, player: 2 })
    expect(rules.getLegalMoves(2).filter(isMoveItemType(MaterialType.Tile)).length).toBe(16 * 15)
  })
})
