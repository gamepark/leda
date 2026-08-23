import { LedaRules } from '@gamepark/leda/LedaRules'
import { pendingChoices } from '@gamepark/leda/rules/effects'
import { HeaderText, usePlayerId, useRules } from '@gamepark/react-game'
import { ChooseEffectDialog } from '../dialogs/ChooseEffectDialog'

/**
 * An "OR": the player resolves one of the branches an effect offers, and only one. Any clan may write one, so
 * this header is the one of every such choice (see {@link ChooseEffectRule}).
 *
 * The bar only says what is happening, and the branches themselves are picked between in the middle of the table
 * (see {@link ChooseEffectDialog}): a choice offered in the bar alone is a choice a player who reads the table
 * first walks straight past.
 */
export const ChooseEffectHeader = () => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  const choice = rules === undefined ? undefined : pendingChoices(rules)[0]
  const itIsMyChoice = rules !== undefined && me !== undefined && rules.getActivePlayer() === me
  return (
    <>
      <HeaderText code="choose-effect" />
      {itIsMyChoice && choice !== undefined && <ChooseEffectDialog choice={choice} rules={rules} player={me} />}
    </>
  )
}
