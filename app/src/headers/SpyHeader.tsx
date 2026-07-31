import { LedaRules } from '@gamepark/leda/LedaRules'
import { spiedItem } from '@gamepark/leda/rules/spy'
import { HeaderText, useRules } from '@gamepark/react-game'

/**
 * A Spy effect asks the player two things in a row, hence the two texts: which pile they look into, then where
 * the item goes back. Both are answered on the table, on the piles themselves (see {@link SpyPileButton}) and on
 * the item they took (see {@link SpiedItemButtons}), so the header only says what is expected of them.
 * Which of the two is read off the state, never off the legal moves, which are filtered in the tutorial and come
 * and go during animations.
 */
export const SpyHeader = () => {
  const rules = useRules<LedaRules>()
  const code = rules !== undefined && spiedItem(rules) !== undefined ? 'spy-return' : 'spy'
  return <HeaderText code={code} />
}
