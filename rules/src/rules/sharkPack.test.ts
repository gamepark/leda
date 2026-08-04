import { isMoveItemType, isStartPlayerTurn, MaterialGame, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { Clan } from '../Clan'
import { LedaRules } from '../LedaRules'
import { ClanCardId } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { sameCell } from '../material/PlayerGrid'
import { SharkSlot } from '../material/SharkSlot'
import { TileId } from '../material/TileId'
import { Memory } from './Memory'
import { RuleId } from './RuleId'
import { sharkSlotOn, sharkTokens } from './sharkPack'

/** A Shark player, their 16 squares empty, their 9 tokens in the supply, and enough Food for the cards given. */
const game = (hand: ClanCardId[], food = 30): MaterialGame<number, MaterialType, LocationType> => ({
  players: [1, 2],
  rule: { id: RuleId.Organisation, player: 1 },
  memory: { [Memory.RoundPlayer]: 1 },
  items: {
    [MaterialType.VictoryConditionCard]: [{ id: Clan.Shark, location: { type: LocationType.PlayerVictoryCondition, player: 1 } }],
    [MaterialType.Tile]: [0, 1, 2, 3].flatMap((y) =>
      [0, 1, 2, 3].map((x) => ({ id: TileId.PermanentFood, location: { type: LocationType.PlayerGrid, player: 1, x, y } }))
    ),
    [MaterialType.ClanCard]: hand.map((front) => ({ id: { front, back: Clan.Shark }, location: { type: LocationType.PlayerHand, player: 1 } })),
    [MaterialType.FoodToken]: [{ location: { type: LocationType.PlayerFood, player: 1 }, quantity: food }],
    [MaterialType.SharkToken]: [{ location: { type: LocationType.PlayerSharkSupply, player: 1 }, quantity: sharkTokens }]
  }
})

const playAll = (rules: LedaRules, move: MaterialMove<number, MaterialType, LocationType>) => {
  for (const consequence of rules.play(move)) playAll(rules, consequence)
}

const tileOn = (rules: LedaRules, cell: XYCoordinates) =>
  rules
    .material(MaterialType.Tile)
    .location(LocationType.PlayerGrid)
    .player(1)
    .getIndexes()
    .find((index) => sameCell(rules.material(MaterialType.Tile).getItem(index).location as XYCoordinates, cell))!

/** The move an organisation plays to put the first card of the hand onto a square. */
const playCardMove = (rules: LedaRules, cell: XYCoordinates) => {
  const hand = rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(1)
  return rules.material(MaterialType.ClanCard).index(hand.getIndexes()[0]).moveItem({
    type: LocationType.PlayedCard,
    player: 1,
    parent: tileOn(rules, cell)
  })
}

const playCard = (rules: LedaRules, cell: XYCoordinates) => {
  playAll(rules, playCardMove(rules, cell))
  // The organisation ends as soon as a card is played, and the next tests go on playing cards all the same.
  rules.game.rule = { id: RuleId.Organisation, player: 1 }
}

const tokens = (rules: LedaRules) => rules.material(MaterialType.SharkToken).location(LocationType.PlacedSharkToken).player(1)

/** Which slot the token of a square sits on, which is read off the squares around it and not off the token. */
const slotOn = (rules: LedaRules, cell: XYCoordinates): SharkSlot | undefined => {
  const tile = tileOn(rules, cell)
  const hasToken = tokens(rules)
    .getItems()
    .some((token) => token.location.parent === tile)
  return hasToken ? sharkSlotOn(rules, 1, cell) : undefined
}

const supply = (rules: LedaRules) => rules.material(MaterialType.SharkToken).location(LocationType.PlayerSharkSupply).player(1).getQuantity()

describe('A Shark card played', () => {
  it('takes a token out of the supply, over the Pack effect it cannot use yet', () => {
    const rules = new LedaRules(game([ClanCardId.SharkMilitary]))
    playCard(rules, { x: 0, y: 0 })
    expect(tokens(rules).length).toBe(1)
    expect(slotOn(rules, { x: 0, y: 0 })).toBe(SharkSlot.Right)
    expect(supply(rules)).toBe(sharkTokens - 1)
  })

  it('takes none when it belongs to another clan', () => {
    const rules = new LedaRules(game([ClanCardId.PandaMilitary]))
    playCard(rules, { x: 0, y: 0 })
    expect(tokens(rules).length).toBe(0)
  })

  it('takes it before the rule that was playing hands the game over', () => {
    const rules = new LedaRules(game([ClanCardId.SharkMilitary]))
    const consequences = rules.play(playCardMove(rules, { x: 0, y: 0 }))
    const token = consequences.findIndex(isMoveItemType(MaterialType.SharkToken))
    const handOver = consequences.findIndex(isStartPlayerTurn)
    // Playing a card is the whole of an organisation: the round would otherwise move on with the token still due.
    expect(token).toBeGreaterThanOrEqual(0)
    expect(token).toBeLessThan(handOver)
  })

  it('leaves the token of its square where it is, rather than taking it back to put it down again', () => {
    const rules = new LedaRules(game([ClanCardId.SharkMilitary, ClanCardId.SharkPackSpy]))
    playCard(rules, { x: 0, y: 0 })
    const move = playCardMove(rules, { x: 0, y: 0 })
    // A square never holds 2 tokens, and the one it holds sits on the square rather than on the card just covered.
    expect(rules.play(move).filter(isMoveItemType(MaterialType.SharkToken))).toHaveLength(0)
    expect(tokens(rules).length).toBe(1)
    expect(supply(rules)).toBe(sharkTokens - 1)
  })
})

describe('The Pack', () => {
  it('wakes up as soon as 2 tokens surround a square, and only for that square', () => {
    const rules = new LedaRules(game([ClanCardId.SharkMilitary, ClanCardId.SharkPackSpy, ClanCardId.SharkPackDrawToken]))
    playCard(rules, { x: 0, y: 0 })
    playCard(rules, { x: 2, y: 0 })
    playCard(rules, { x: 1, y: 0 })
    expect(slotOn(rules, { x: 1, y: 0 })).toBe(SharkSlot.Left)
    // Each of the 2 others has a single token beside it.
    expect(slotOn(rules, { x: 0, y: 0 })).toBe(SharkSlot.Right)
    expect(slotOn(rules, { x: 2, y: 0 })).toBe(SharkSlot.Right)
  })

  it('counts the token of the square it surrounds for nothing, and reads its neighbours orthogonally', () => {
    const rules = new LedaRules(game([ClanCardId.SharkMilitary, ClanCardId.SharkPackSpy, ClanCardId.SharkPackDrawToken]))
    playCard(rules, { x: 0, y: 0 })
    playCard(rules, { x: 1, y: 1 })
    playCard(rules, { x: 2, y: 2 })
    // A diagonal is not a neighbour: not one of the 3 has a Pack.
    const slots = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 }
    ].map((cell) => slotOn(rules, cell))
    expect(slots).toEqual([SharkSlot.Right, SharkSlot.Right, SharkSlot.Right])
  })

  it('falls asleep again when the squares around one are swapped away from it', () => {
    const rules = new LedaRules(game([ClanCardId.SharkMilitary, ClanCardId.SharkPackSpy, ClanCardId.SharkPackDrawToken]))
    playCard(rules, { x: 0, y: 0 })
    playCard(rules, { x: 2, y: 0 })
    playCard(rules, { x: 1, y: 0 })
    expect(slotOn(rules, { x: 1, y: 0 })).toBe(SharkSlot.Left)
    // The square of the Pack is swapped with an empty corner, which leaves it with no token beside it.
    const swap = rules
      .getLegalMoves(1)
      .filter(isMoveItemType(MaterialType.Tile))
      .find((move) => move.itemIndex === tileOn(rules, { x: 1, y: 0 }) && move.location.x === 3 && move.location.y === 3)!
    playAll(rules, swap)
    expect(slotOn(rules, { x: 3, y: 3 })).toBe(SharkSlot.Right)
  })
})
