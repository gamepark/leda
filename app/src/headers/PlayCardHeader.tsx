import { LedaRules } from '@gamepark/leda/LedaRules'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { cardDiscount } from '@gamepark/leda/rules/effects'
import { HeaderText, useRules } from '@gamepark/react-game'
import { isCustomMoveType } from '@gamepark/rules-api'
import { FoodIcon } from './FoodIcon'

/**
 * An effect that lets a player play a card out of turn, at a discount. The card is played on the table, by dragging
 * it onto a square, so the header only says what is expected and how much is taken off the price.
 * Turning it down has nowhere else to be said, hence the button: it is the only move of this rule that is not a
 * card being played (see {@link PlayCardRule}).
 */
export const PlayCardHeader = () => {
  const rules = useRules<LedaRules>()
  return (
    <HeaderText
      code="play-card"
      values={{ discount: rules === undefined ? 0 : cardDiscount(rules) }}
      components={{ food: <FoodIcon /> }}
      moves={{ decline: isCustomMoveType(CustomMoveType.Pass) }}
    />
  )
}
