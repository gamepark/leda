import { LedaRules } from '@gamepark/leda/LedaRules'
import { cardsOwed } from '@gamepark/leda/rules/organisation'
import { HeaderText, useRules } from '@gamepark/react-game'

/**
 * The price of one of the 3 Cat cards paid with cards: its owner puts as many cards of their hand under their
 * deck. They are given on the table, by dragging them onto the deck, so the header only counts what is still due
 * (see {@link PayCardCostRule}).
 */
export const PayCardCostHeader = () => {
  const rules = useRules<LedaRules>()
  return <HeaderText code="pay-card-cost" values={{ count: rules === undefined ? 0 : cardsOwed(rules) }} />
}
