import { areAdjacentSquares, isMoveItemType, ItemMove, MaterialItem, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { Clan } from '../Clan'
import { ClanCardItemId, clanOf } from '../material/ClanCardId'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, gridTiles, sameCell } from '../material/PlayerGrid'
import { SharkSlot } from '../material/SharkSlot'
import { Rules } from '../Rules'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The Pack of the Sharks, which is where their tokens sit rather than an effect of its own.
 *
 * A Shark card played takes a token on the right slot of its effect area, over the Pack effect: only the normal
 * effect on the left is available. A square surrounded by 2 Shark tokens wakes its Pack up: the token slides to
 * the left slot, covering the normal effect and revealing the Pack one. It slides back as soon as the Pack falls
 * asleep again, which the squares around it may do at any time, a swap of 2 squares included.
 *
 * So the slot of a token is never chosen, it is read off the board (see {@link sharkSlotMoves}): the rules only
 * ever put every token back where the board says it belongs.
 */

/** How many tokens the Shark clan owns. Having all 9 of them in play is how the Sharks win the game. */
export const sharkTokens = 9

/** How many Shark tokens have to surround a square for its Pack to wake up. */
export const packSize = 2

/** The Shark tokens a player has on their grid. */
export const placedSharkTokens = (rules: Rules, player: number) =>
  rules.material(MaterialType.SharkToken).location(LocationType.PlacedSharkToken).player(player)

/** The Shark tokens a player has not placed yet. */
export const sharkSupply = (rules: Rules, player: number) =>
  rules.material(MaterialType.SharkToken).location(LocationType.PlayerSharkSupply).player(player)

/** The squares of a player's grid a token may still be placed on, which are the ones that have none. */
export const tilesWithoutSharkToken = (rules: Rules, player: number) => {
  const taken = placedSharkTokens(rules, player)
    .getItems()
    .map((token) => token.location.parent)
  return gridTiles(rules.material(MaterialType.Tile), player).index((index) => !taken.includes(index))
}

/** The square a placed token stands on, which is the square of the tile it was placed on. */
const cellOfToken = (rules: Rules, token: MaterialItem<number, LocationType>): XYCoordinates =>
  cellOf(rules.material(MaterialType.Tile).getItem(token.location.parent!).location)

/** The squares of a player's grid that hold a Shark token. */
export const sharkTokenCells = (rules: Rules, player: number): XYCoordinates[] =>
  placedSharkTokens(rules, player)
    .getItems()
    .map((token) => cellOfToken(rules, token))

/** How many Shark tokens sit on the squares orthogonally next to one, which is what wakes its Pack up. */
export const adjacentSharkTokens = (rules: Rules, player: number, cell: XYCoordinates): number =>
  sharkTokenCells(rules, player).filter((taken) => areAdjacentSquares(taken, cell)).length

/**
 * Which slot the token of a square sits on, whether one is there or not.
 *
 * Never written down: the slot of a token is what the squares around it say, so it is read here every time rather
 * than kept in its location and put right after every move. On the table, that is a token sliding over as the
 * board changes around it, which the app draws by asking this (see {@link PlacedSharkTokenLocator}).
 */
export const sharkSlotOn = (rules: Rules, player: number, cell: XYCoordinates): SharkSlot =>
  adjacentSharkTokens(rules, player, cell) >= packSize ? SharkSlot.Left : SharkSlot.Right

/**
 * Whether the card on a square gives its Pack effect rather than its normal one, which is what a token on the left
 * slot means. A square with no token has no Pack: the tokens are what the Sharks read their grid with.
 */
export const isPackActive = (rules: Rules, player: number, cell: XYCoordinates): boolean =>
  sharkTokenCells(rules, player).some((taken) => sameCell(taken, cell)) && sharkSlotOn(rules, player, cell) === SharkSlot.Left

/**
 * The token a Shark card takes as it is played: one out of the supply, onto the square of the card.
 *
 * A square that already has one keeps it. The rulebook has the player discard that token and place a new one,
 * because around a table the token lies on the card and a card just covered the one under it; here it lies on the
 * square, which has not moved.
 */
const playSharkTokenMoves = (rules: Rules, player: number, tile: number): Move[] => {
  if (placedSharkTokens(rules, player).parent(tile).length > 0) return []
  return sharkSupply(rules, player).moveItems({ type: LocationType.PlacedSharkToken, player, parent: tile }, 1)
}

/**
 * What a move does to the Shark tokens, which is only ever this: a Shark card played takes one out of the supply.
 * Where each token sits on its card follows the board on its own, nothing having to be moved for it.
 *
 * Read off the move rather than off the rule that played it, and hooked to the game rather than to any one rule
 * (see {@link LedaRules.afterItemMove}): a card is played during an organisation, and by an effect in the middle
 * of an activation.
 */
export const sharkMoves = (rules: Rules, move: ItemMove<number, MaterialType, LocationType>): Move[] => {
  if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.type !== LocationType.PlayedCard) return []
  const player = move.location.player
  const front = rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(move.itemIndex).id?.front
  if (player === undefined || front === undefined || clanOf(front) !== Clan.Shark) return []
  return playSharkTokenMoves(rules, player, move.location.parent!)
}
