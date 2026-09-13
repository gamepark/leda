import { LedaRules } from '@gamepark/leda/LedaRules'
import { spiableEggs, spiedEgg, spiedItem } from '@gamepark/leda/rules/spy'
import { HeaderText, useRules } from '@gamepark/react-game'

/**
 * A Spy effect asks the player two things in a row, hence the texts: which pile they look into, or which Egg of
 * their opponent they read, then where what they took goes back. Both are answered on the table, on the piles
 * themselves (see {@link SpyPileButton}), on the Egg itself (see {@link SpyEggButton}) and on the item they took
 * (see {@link SpiedItemButtons}), so the header only says what is expected of them.
 * Which of the two is read off the state, never off the legal moves, which are filtered in the tutorial and come
 * and go during animations.
 */
export const SpyHeader = () => {
  const rules = useRules<LedaRules>()
  const player = rules?.getActivePlayer()
  if (rules === undefined || player === undefined) return <HeaderText code="spy" />
  // An Egg is turned back where it lies, so the second question is not the one a pile asks.
  if (spiedEgg(rules).length > 0) return <HeaderText code="spy-return-egg" />
  if (spiedItem(rules) === undefined) {
    // The Eggs of the Snakes are a 4th thing to look at, and only while that clan has one on the table.
    return <HeaderText code={spiableEggs(rules, player).length > 0 ? 'spy-egg' : 'spy'} />
  }
  return <HeaderText code="spy-return" />
}
