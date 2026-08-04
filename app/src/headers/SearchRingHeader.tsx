import { HeaderText, ThemeButton, usePlayerId, useRules } from '@gamepark/react-game'
import { useState } from 'react'
import { SearchRingDialog } from '../dialogs/SearchRingDialog'

/**
 * A Cat card taking a Ring out of its owner's deck and into their hand (see {@link SearchRingRule}).
 * Nothing on the table stands for the Rings still in the deck, so the choice is made in a dialog.
 */
export const SearchRingHeader = () => {
  const rules = useRules()
  const me = usePlayerId<number>()
  // Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
  const itIsMyTurn = me !== undefined && rules?.getActivePlayer() === me

  if (!itIsMyTurn) {
    return <HeaderText code="search-ring" />
  }
  return <MySearch />
}

/**
 * The dialog is hosted here rather than in App: it belongs to this step of the rules, which is exactly how long
 * this header is displayed. The header doubles as the way back to it once it has been dismissed, through the
 * <reopen> tag of the translation (see {@link ChooseClanHeader}, which does the same).
 */
const MySearch = () => {
  const [dismissed, setDismissed] = useState(false)
  return (
    <>
      <HeaderText code="search-ring" components={{ reopen: <ThemeButton onClick={() => setDismissed(false)} /> }} />
      <SearchRingDialog open={!dismissed} close={() => setDismissed(true)} />
    </>
  )
}
