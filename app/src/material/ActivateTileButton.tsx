import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { activableCells } from '@gamepark/leda/rules/activation'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { LedaMenuButton } from './LedaMenuButton'
import { tileButtonPosition } from './tileButtonPosition'
import { TileButtonProps } from './TileMenuButton'

/**
 * Every square of the zone the player has left to activate carries a button, since they activate them in the
 * order of their choice. Which squares are left comes from the same helper the rules use to know what is legal.
 */
export const ActivateTileButton = ({ index, rules, player }: TileButtonProps) => {
  const cell = cellOf(rules.material(MaterialType.Tile).getItem(index).location)
  if (!activableCells(rules, player).some((activable) => sameCell(activable, cell))) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={MaterialMoveBuilder.customMove(CustomMoveType.ActivateSquare, cell)}>
      <FontAwesomeIcon icon={faBolt} />
    </LedaMenuButton>
  )
}
