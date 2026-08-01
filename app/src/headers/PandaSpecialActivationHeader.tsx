import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { PandaSpecialActivation } from '@gamepark/leda/rules/specialActivation'
import { HeaderText } from '@gamepark/react-game'
import { isCustomMoveType, MaterialMove } from '@gamepark/rules-api'

/** The two halves of the choice, each placed by its tag in the translation, like the Mulligan buttons. */
const choice = (choice: PandaSpecialActivation) => (move: MaterialMove) =>
  isCustomMoveType<CustomMoveType, PandaSpecialActivation>(CustomMoveType.ChooseSpecialActivation)(move) && move.data === choice

/**
 * The special activation of the Pandas is answered in the header itself: neither half of the choice is a place
 * on the table one could click, since an Awakening has no material of its own.
 */
export const PandaSpecialActivationHeader = () => (
  <HeaderText
    code="panda-special-activation"
    moves={{
      food: choice(PandaSpecialActivation.Food),
      awakening: choice(PandaSpecialActivation.Awakening)
    }}
  />
)
