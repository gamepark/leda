import { CustomMove, isCustomMoveType, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { CustomMoveType } from './CustomMoveType'
import { EffectRule } from './EffectRule'
import { Memory } from './Memory'
import { awakenings, PandaSpecialActivation } from './specialActivation'

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The special activation of the Pandas: 1 Food or 1 Awakening, whichever the player prefers. Both are always
 * available, so this rule never has to hand the game back without asking anything, unlike the other effects.
 *
 * TODO: an Awakening is only counted here (see {@link Memory.Awakenings}). What it is spent on is on the Panda
 * cards, which do not exist yet.
 */
export class PandaSpecialActivationRule extends EffectRule {
  getPlayerMoves(): Move[] {
    return [
      this.customMove(CustomMoveType.ChooseSpecialActivation, PandaSpecialActivation.Food),
      this.customMove(CustomMoveType.ChooseSpecialActivation, PandaSpecialActivation.Awakening)
    ]
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType<CustomMoveType, PandaSpecialActivation>(CustomMoveType.ChooseSpecialActivation)(move)) return []
    if (move.data === undefined) return []
    return [...this.gain(move.data), ...this.resume()]
  }

  gain(choice: PandaSpecialActivation): Move[] {
    if (choice === PandaSpecialActivation.Food) {
      return [this.material(MaterialType.FoodToken).createItem({ location: { type: LocationType.PlayerFood, player: this.player }, quantity: 1 })]
    }
    // No item stands for an Awakening: like a military symbol, it is only counted.
    this.memorize(Memory.Awakenings, awakenings(this, this.player) + 1, this.player)
    return []
  }
}
