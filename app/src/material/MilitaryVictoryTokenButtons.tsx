import { faBolt, faRotate } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { militaryVictoryEffects, MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { LedaMenuButton } from './LedaMenuButton'
import { useMenuButtonRules } from './menuButtons'

/**
 * The buttons a Military Victory token a player has won carries: the Shark cards are the ones that ask anything of
 * them once they are won, either to trade one for the next of the pile or to resolve one all over again.
 *
 * Read off the state nothing is still catching up with, like every other button of the table
 * (see {@link useMenuButtonRules}).
 */
export const MilitaryVictoryTokenButtons = ({ index }: { index: number }) => {
  const context = useMenuButtonRules()
  if (context === undefined) return null
  const { rules, player: me } = context
  if (rules.getActivePlayer() !== me) return null
  const token = rules.material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(index)
  if (token?.location.type !== LocationType.PlayerMilitaryVictory || token.location.player !== me) return null

  switch (rules.game.rule?.id) {
    case RuleId.RedrawMilitaryVictory:
      // Under the pile, which is x 0: the token traded is not the one drawn right after.
      return (
        <LedaMenuButton x={2} move={rules.material(MaterialType.MilitaryVictoryToken).index(index).moveItem({ type: LocationType.MilitaryVictoryDeck, x: 0 })}>
          <FontAwesomeIcon icon={faRotate} />
        </LedaMenuButton>
      )
    case RuleId.TriggerMilitaryVictory:
      // A token worth nothing but its Victory symbols has nothing to trigger.
      if (militaryVictoryEffects[token.id] === undefined) return null
      return (
        <LedaMenuButton move={MaterialMoveBuilder.customMove(CustomMoveType.TriggerMilitaryVictory, index)}>
          <FontAwesomeIcon icon={faBolt} />
        </LedaMenuButton>
      )
    default:
      return null
  }
}
