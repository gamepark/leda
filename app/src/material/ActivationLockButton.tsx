import { faLock } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { lockedCells } from '@gamepark/leda/rules/activation'
import { useState } from 'react'
import { ActivationLockDialog } from '../dialogs/ActivationLockDialog'
import { LedaMenuButton } from './LedaMenuButton'
import { useMenuButtonRules } from './menuButtons'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The lock a square carries when the rule waiting would be offering it and is not, because what stands on it has
 * already been activated this phase (see {@link lockedCells} and {@link ActivationLockDialog}).
 *
 * Only then: a lock answers the question a player is asking at that moment, which is why the square they were
 * aiming at is not among the ones shining. A square they went through earlier and that nothing is asking about
 * carries none, and neither does a grid nobody is being asked about.
 *
 * Named by the tile of the square, the way the mark of a swap is, so that a card played on that square asks the
 * very same question through the very same tile (see {@link SwapHistoryButton}).
 *
 * Read through the same guarded state as the buttons that play a move, and not through {@link useRules}: the lock
 * and the medallions it explains the absence of have to be read off one state, or the table would show a lock on
 * a square that is shining again (see {@link useMenuButtonRules}).
 *
 * In the corner opposite the one those buttons sit in, where it can never sit on one: a Scorpion card upgrading a
 * tile it can no longer activate offers both at once (see {@link UpgradeAndActivateTileRule}). It shares that
 * corner with the mark of a swap, which belongs to the organisation and is only ever there once the activation is
 * over.
 */
export const ActivationLockButton = ({ tile }: { tile: number }) => {
  const context = useMenuButtonRules()
  const [open, setOpen] = useState(false)

  if (context === undefined) return null
  const { rules, player: me } = context
  const location = rules.material(MaterialType.Tile).getItem(tile)?.location
  if (location?.type !== LocationType.PlayerGrid || location.player !== me) return null
  if (!lockedCells(rules, me).some((locked) => sameCell(locked, cellOf(location)))) return null

  return (
    <>
      <LedaMenuButton x={-tileButtonPosition.x} y={tileButtonPosition.y} labelPosition="right" onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faLock} />
      </LedaMenuButton>
      <ActivationLockDialog open={open} close={() => setOpen(false)} />
    </>
  )
}
