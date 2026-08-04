import { faBolt, faRotate } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { militaryVictoryEffects, MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { usePlayerId, useRules } from '@gamepark/react-game'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { LedaMenuButton } from './LedaMenuButton'

/**
 * The buttons a Military Victory token a player has won carries: the Shark cards are the ones that ask anything of
 * them once they are won, either to trade one for the next of the pile or to resolve one all over again.
 *
 * Read through the hooks rather than through the context handed to the material description: a token is only
 * re-rendered when its own item changes, which is far from every time its button has to change.
 */
export const MilitaryVictoryTokenButtons = ({ index }: { index: number }) => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  // Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
  if (!rules || me === undefined || rules.getActivePlayer() !== me) return null
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
