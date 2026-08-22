import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { MaterialMoveBuilder, XYCoordinates } from '@gamepark/rules-api'
import { LedaMenuButton } from './LedaMenuButton'
import { offeredCells } from './menuButtons'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The medallion that activates a square. Every rule that has a player activate one asks for the same move on the
 * same square, whatever it names to get there: the squares of the zone of the round, the tile a Shark card asks
 * for, the Desert a Scorpion card reads, or the card a Panda Queen activates.
 * What those rules do not share is which squares they offer, and that stays with each of them.
 */
export const ActivateSquareButton = ({ cell }: { cell: XYCoordinates }) => (
  <LedaMenuButton {...tileButtonPosition} move={MaterialMoveBuilder.customMove(CustomMoveType.ActivateSquare, cell)}>
    <FontAwesomeIcon icon={faBolt} />
  </LedaMenuButton>
)

/**
 * The medallion on a bare tile, carried by the squares the rule waiting is offering and by no other: which squares
 * those are is read off the moves that rule hands the player (see {@link offeredCells}), whichever of the rules
 * that activate a square is the one waiting.
 */
export const ActivateSquareOnTile = ({ index, rules, player }: TileButtonProps) => {
  const cell = cellOf(rules.material(MaterialType.Tile).getItem(index).location)
  if (!offeredCells(rules, player, CustomMoveType.ActivateSquare).some((activable) => sameCell(activable, cell))) return null
  return <ActivateSquareButton cell={cell} />
}
