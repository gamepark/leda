import { isMoveItemType, ItemMove, MaterialMove, MaterialRulesPart } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MilitaryVictoryTokenId } from '../material/MilitaryVictoryTokenId'
import { Memory } from './Memory'
import { conflictWinner } from './militaryConflict'
import { RuleId } from './RuleId'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The effects a token does not resolve on its own, and the rule that asks the player to make the choice.
 * That rule takes the round to its end once the player has chosen, which is what {@link Memory.NextRule} says.
 */
const tokenChoices: Partial<Record<MilitaryVictoryTokenId, RuleId>> = {
  [MilitaryVictoryTokenId.Upgrade]: RuleId.UpgradeTile,
  [MilitaryVictoryTokenId.FlipDesert]: RuleId.FlipDesert,
  [MilitaryVictoryTokenId.Spy]: RuleId.Spy
}

/**
 * Phase 2 of a round: the players compare the military symbols they gathered while activating the zone, and the
 * one who has the most takes the top Military Victory token, reveals it, and resolves its effect.
 *
 * Nobody is asked anything to get there, so this rule has no player of its own: it is started with startRule, and
 * only the effects that are a choice hand a player the turn.
 */
export class MilitaryConflictRule extends MaterialRulesPart<number, MaterialType, LocationType> {
  /** The token is drawn face down, so its effect can only be read once the move that reveals it has been played. */
  onRuleStart(): Move[] {
    const winner = conflictWinner(this)
    if (winner === undefined || !this.deck.length) return [this.startRule(RuleId.EndOfRound)]
    return this.deck.limit(1).moveItems({ type: LocationType.PlayerMilitaryVictory, player: winner })
  }

  afterItemMove(move: ItemMove<number, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.MilitaryVictoryToken)(move)) return []
    if (move.location.type !== LocationType.PlayerMilitaryVictory) return []
    const player = move.location.player!
    const token = this.material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(move.itemIndex)
    const choice = tokenChoices[token.id]
    if (choice !== undefined) {
      this.memorize(Memory.NextRule, RuleId.EndOfRound)
      return [this.startPlayerTurn(choice, player)]
    }
    return [...this.resolve(token.id, player), this.startRule(RuleId.EndOfRound)]
  }

  /** What a token gives beyond the Victory symbols printed on it, when it gives it on its own. */
  resolve(token: MilitaryVictoryTokenId, player: number): Move[] {
    switch (token) {
      case MilitaryVictoryTokenId.Food:
        return [this.material(MaterialType.FoodToken).createItem({ location: { type: LocationType.PlayerFood, player }, quantity: 1 })]
      case MilitaryVictoryTokenId.Draw:
        return this.deckOf(player).limit(1).moveItems({ type: LocationType.PlayerHand, player })
      case MilitaryVictoryTokenId.StealFood:
        // An opponent with no Food has nothing to take, and the effect is simply ignored.
        return this.foodOf(this.opponentOf(player)).moveItems({ type: LocationType.PlayerFood, player }, 1)
      default:
        // Victory and DoubleVictory are worth their symbols and nothing else.
        return []
    }
  }

  /** deck() draws from the highest x, which is the top of the pile the DeckLocator stacks. */
  get deck() {
    return this.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck).deck()
  }

  deckOf(player: number) {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(player).deck()
  }

  foodOf(player: number) {
    return this.material(MaterialType.FoodToken).location(LocationType.PlayerFood).player(player)
  }

  opponentOf(player: number): number {
    return this.game.players.find((other) => other !== player) ?? player
  }
}
