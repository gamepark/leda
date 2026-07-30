import { CustomMove, isCreateItemType, isCustomMoveType, ItemMove, MaterialMove, PlayerTurnRule } from '@gamepark/rules-api'
import { Clan, clanCards, playableClans } from '../Clan'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'

/** The Shark clan comes with 9 tokens of its own. The other clans have no extra material. */
const sharkTokens = 9

/** Setup step 6: the starting resources, the same for the 4 clans of this box. */
const startingHand = 3
const startingFood = 1

/**
 * Setup step 6: in turn order, a player picks a clan from the box and takes its material.
 * None of it exists before that, since nobody knows which clans will be played: this rule creates it.
 */
export class ChooseClanRule extends PlayerTurnRule<number, MaterialType, LocationType> {
  getPlayerMoves() {
    if (this.hasClan(this.player)) return []
    return this.availableClans.map((clan) => this.customMove(CustomMoveType.ChooseClan, clan))
  }

  /** A clan that has been picked has its Victory condition card in front of its owner, which is what marks it taken. */
  get availableClans(): Clan[] {
    const taken = this.material(MaterialType.VictoryConditionCard).getItems<Clan>()
    return playableClans.filter((clan) => !taken.some((card) => card.id === clan))
  }

  hasClan(player: number) {
    return this.material(MaterialType.VictoryConditionCard).player(player).length > 0
  }

  onCustomMove(move: CustomMove): MaterialMove<number, MaterialType, LocationType>[] {
    if (!isCustomMoveType<CustomMoveType, Clan>(CustomMoveType.ChooseClan)(move)) return []
    const clan = move.data
    if (clan === undefined) return []
    const player = this.player
    return [
      // A whole deck appears at once: one move rather than one per card.
      this.material(MaterialType.ClanCard).createItemsAtOnce(
        clanCards(clan).map((front) => ({ id: { front, back: clan }, location: { type: LocationType.PlayerDeck, player } }))
      ),
      ...(clan === Clan.Shark
        ? [this.material(MaterialType.SharkToken).createItem({ location: { type: LocationType.PlayerSharkSupply, player }, quantity: sharkTokens })]
        : []),
      // Created last on purpose: it is the marker that the clan is taken, and taking it is what triggers the rest
      // of the step in afterItemMove, once the cards it has to shuffle and draw from exist.
      this.material(MaterialType.VictoryConditionCard).createItem({ id: clan, location: { type: LocationType.PlayerVictoryCondition, player } })
    ]
  }

  /**
   * The deck cannot be shuffled in onCustomMove: the consequences of a move are all built before any of them is
   * played, so a shuffle would be computed against a deck that does not exist yet. Waiting for the Victory condition
   * card to be created puts us after every creation.
   */
  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): MaterialMove<number, MaterialType, LocationType>[] {
    if (!isCreateItemType(MaterialType.VictoryConditionCard)(move)) return []
    const player = this.player
    return [
      this.deck.shuffle(),
      // Shuffling swaps the cards between the slots of the deck without moving the slots, so drawing the 3 first
      // slots draws 3 random cards even though these moves are built before the shuffle is played.
      ...this.deck.limit(startingHand).moveItems({ type: LocationType.PlayerHand, player }),
      this.material(MaterialType.FoodToken).createItem({ location: { type: LocationType.PlayerFood, player }, quantity: startingFood }),
      ...this.nextStep()
    ]
  }

  get deck() {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(this.player)
  }

  nextStep() {
    const opponent = this.nextPlayer
    if (!this.hasClan(opponent)) return [this.startPlayerTurn(this.game.rule!.id, opponent)]
    // TODO: both players are ready. Next comes the mulligan of setup step 6, then the first round.
    return []
  }
}
