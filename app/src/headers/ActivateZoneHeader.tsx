import { LedaRules } from '@gamepark/leda/LedaRules'
import { activableCells, hatchableCells } from '@gamepark/leda/rules/activation'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { eggCost } from '@gamepark/leda/rules/snake'
import { HeaderText, useRules } from '@gamepark/react-game'
import { isCustomMoveType } from '@gamepark/rules-api'
import { FoodIcon } from './FoodIcon'

/**
 * Phase 1: the player activates the squares of the zone in their own grid, in the order of their choice.
 *
 * A player of the Snakes has one more thing to do there, and one thing they are offered rather than owed: paying
 * to hatch an Egg of the zone (see {@link ActivateZoneRule}). So the header says what is left of the two, and
 * carries the way out once the zone itself is done, which is the one moment this phase can be passed.
 *
 * Which of the 3 sentences is read off the grid of the player whose turn it is, and never off the legal moves,
 * which are filtered in the tutorial and come and go while animations play.
 */
export const ActivateZoneHeader = () => {
  const rules = useRules<LedaRules>()
  const player = rules?.getActivePlayer()
  if (rules === undefined || player === undefined) return <HeaderText code="activate-zone" />
  if (hatchableCells(rules, player).length === 0) return <HeaderText code="activate-zone" />
  const values = { count: eggCost }
  const components = { food: <FoodIcon /> }
  if (activableCells(rules, player).length > 0) return <HeaderText code="activate-zone-hatch" values={values} components={components} />
  return (
    <HeaderText
      code="hatch-egg"
      values={values}
      components={components}
      moves={{ decline: isCustomMoveType(CustomMoveType.Pass) }}
    />
  )
}
