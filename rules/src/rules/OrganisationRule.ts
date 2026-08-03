import { isCreateItemType, isMoveItemType, ItemMove, MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { ClanCardItemId, revealedFront } from '../material/ClanCardId'
import { clanCardFoodCost } from '../material/clanCards/cardProperties'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { cellOf, gridTiles, tileAt } from '../material/PlayerGrid'
import { Memory } from './Memory'
import { playerFood } from './organisation'
import { RuleId } from './RuleId'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * Still phase 3: a player plays one clan card from their hand onto a square of their grid, or swaps 2 of their
 * squares and gains 1 Food. Then their opponent organises their own grid, and the round ends.
 *
 * The Food always comes after the swap, as the rulebook has it. A player who would rather not move anything may
 * take it on its own, which is the third thing they may do, and gaining it is what ends an organisation either
 * way: nothing else is due once a player has been paid for their squares.
 */
export class OrganisationRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  getPlayerMoves(): Move[] {
    return [...this.playCardMoves, this.gainFood, ...this.swapMoves]
  }

  /**
   * Playing one card from the hand onto any of the 16 squares of the player's own grid, provided they own the
   * Food it costs. A card is played on the tile of the square rather than on the square itself, hence the parent
   * of its location (see {@link LocationType.PlayedCard}).
   * A card with no Food cost is one that cannot be bought at all: a Ring, or one of the Cat cards paid with
   * cards from the hand (see {@link clanCardFoodCost}).
   */
  get playCardMoves(): Move[] {
    const food = playerFood(this, this.player)
    const cards = this.material(MaterialType.ClanCard)
    const parents = this.tiles.getIndexes()
    return this.hand.getIndexes().flatMap((index) => {
      const cost = this.foodCost(index)
      if (cost === undefined || cost > food) return []
      return parents.map((parent) => cards.index(index).moveItem({ type: LocationType.PlayedCard, player: this.player, parent }))
    })
  }

  /**
   * What the card at that index costs its owner in Food, undefined when it cannot be bought with Food, and
   * undefined too when nobody here knows which card it is.
   *
   * A hand is secret, so on the client of the opponent a card is still nothing but the back of its clan until the
   * move that plays it is applied. `front` is what the move reveals in that case: this runs before the item is
   * moved, hence before its id has been filled in (see {@link beforeItemMove}).
   */
  foodCost(index: number, front = this.material(MaterialType.ClanCard).getItem<ClanCardItemId>(index).id?.front): number | undefined {
    return front === undefined ? undefined : clanCardFoodCost(front, this, this.player)
  }

  /**
   * Swapping 2 squares of the player's own grid, in both directions: the drag says which tile is taken and where
   * it goes, and {@link beforeItemMove} sends the tile that was there the other way round.
   * The location of a move is built from the tile itself, so that it keeps the face it shows: whether a tile is
   * upgraded, or turned onto its Desert side, is the rotation of its location.
   */
  get swapMoves(): Move[] {
    const tiles = this.tiles
    const cells = tiles.getItems().map((tile) => cellOf(tile.location))
    return tiles
      .getIndexes()
      .flatMap((index, position) => cells.filter((_, other) => other !== position).map((cell) => tiles.index(index).moveItem((tile) => ({ ...tile.location, ...cell }))))
  }

  /**
   * Read before the move is played, which for both cases below is the only moment the state still says what the
   * player was looking at. What is returned is played after the move all the same.
   *
   * A swap: the other half of it, the tile that was on the square being moved to. Nothing is due for that second
   * half, which lands on the square the first one has just left, and is not a swap of its own. The Food the swap
   * is worth is gained once it is done, and it is what takes the organisation to its end.
   *
   * A card being played: its price, while it is still in the hand a Portal counts (see {@link FoodCost}).
   */
  beforeItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (isMoveItemType(MaterialType.ClanCard)(move) && move.location.type === LocationType.PlayedCard) {
      const cost = this.foodCost(move.itemIndex, revealedFront(move)) ?? 0
      return cost > 0 ? [this.food.deleteItem(cost)] : []
    }
    if (!isMoveItemType(MaterialType.Tile)(move)) return []
    const swapped = tileAt(this.material(MaterialType.Tile), this.player, cellOf(move.location))
    if (!swapped.length) return []
    const { x, y } = this.material(MaterialType.Tile).getItem(move.itemIndex).location
    return [swapped.moveItem((tile) => ({ ...tile.location, x, y })), this.gainFood]
  }

  /**
   * Playing a card is the whole organisation of its owner. So is gaining the Food, whether the player swapped 2
   * squares to earn it or simply took it: either way they have been paid for their squares, and there is nothing
   * left for them to do.
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (this.gainedOrganisationFood(move)) return this.nextStep()
    if (!isMoveItemType(MaterialType.ClanCard)(move) || move.location.type !== LocationType.PlayedCard) return []
    return this.nextStep()
  }

  gainedOrganisationFood(move: ItemMove<number, MaterialType, LocationType>): boolean {
    if (!isCreateItemType(MaterialType.FoodToken)(move)) return false
    return move.item.location.type === LocationType.PlayerFood && move.item.location.player === this.player
  }

  get gainFood(): Move {
    return this.material(MaterialType.FoodToken).createItem({ location: { type: LocationType.PlayerFood, player: this.player }, quantity: 1 })
  }

  get tiles() {
    return gridTiles(this.material(MaterialType.Tile), this.player)
  }

  get hand() {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(this.player)
  }

  get food() {
    return this.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(this.player)
  }

  /** The player who opened the round organises first, then their opponent, and the round is over. */
  nextStep(): Move[] {
    if (this.player === this.remind<number>(Memory.RoundPlayer)) return [this.startPlayerTurn(RuleId.Organisation, this.nextPlayer)]
    return [this.startRule(RuleId.EndOfRound)]
  }
}
