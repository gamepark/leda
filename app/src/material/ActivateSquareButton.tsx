import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { MaterialMoveBuilder, XYCoordinates } from '@gamepark/rules-api'
import { LedaMenuButton } from './LedaMenuButton'
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

type ActivateSquareOnTileProps = {
  /** Index of the tile in the game state, which is stable, unlike the item a stale render would carry. */
  index: number
  rules: LedaRules
  /** The squares the rule waiting offers, named with the very helper that rule reads to know what is legal. */
  cells: XYCoordinates[]
}

/** The medallion on a bare tile, carried by the squares the rule waiting is offering and by no other. */
export const ActivateSquareOnTile = ({ index, rules, cells }: ActivateSquareOnTileProps) => {
  const cell = cellOf(rules.material(MaterialType.Tile).getItem(index).location)
  if (!cells.some((activable) => sameCell(activable, cell))) return null
  return <ActivateSquareButton cell={cell} />
}
