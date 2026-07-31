import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { usePlay } from '@gamepark/react-game'
import { MaterialMove } from '@gamepark/rules-api'
import { canSelectCell, clearSelectionMoves, selectCellMoves } from './actionZoneSelection'
import { LedaMenuButton } from './LedaMenuButton'
import { tileButtonPosition } from './tileButtonPosition'
import { TileButtonProps } from './TileMenuButton'

/**
 * While the player picks the zone to activate, every square they may add to their selection carries a button,
 * and every square they selected carries the one that takes the selection back.
 */
export const ChooseActionTileButton = ({ index, rules, player }: TileButtonProps) => {
  const play = usePlay<MaterialMove<number, MaterialType, LocationType>>()
  const playAll = (moves: MaterialMove<number, MaterialType, LocationType>[]) => moves.forEach((move) => play(move, { transient: true }))

  const item = rules.material(MaterialType.Tile).getItem(index)
  if (item.selected) {
    // Whichever square of the selection it is clicked on, the button drops the selection whole.
    return (
      <LedaMenuButton filled {...tileButtonPosition} onClick={() => playAll(clearSelectionMoves(rules))}>
        <FontAwesomeIcon icon={faXmark} />
      </LedaMenuButton>
    )
  }

  const cell = cellOf(item.location)
  if (!canSelectCell(rules, player, cell)) return null
  return (
    <LedaMenuButton {...tileButtonPosition} onClick={() => playAll(selectCellMoves(rules, player, cell))}>
      <FontAwesomeIcon icon={faCheck} />
    </LedaMenuButton>
  )
}
