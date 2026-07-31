import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { usePlay, usePlayerId, useRules } from '@gamepark/react-game'
import { MaterialMove } from '@gamepark/rules-api'
import { canSelectCell, cellOf, clearSelectionMoves, selectCellMoves } from './actionZoneSelection'
import { LedaMenuButton } from './LedaMenuButton'

/**
 * Where the button sits on its square, in centimeters from its center: tucked into the top left corner, a bit
 * inside the 7 cm tile, so that it leaves the bottom of the artwork, where the symbols of the tile are read.
 * Not read off tileSize, which lives in the description that mounts this button: importing it back would make
 * the two modules load each other.
 */
const buttonOffset = -2.2

/**
 * The button carried by a square of the player's own grid, while they pick the zone to activate.
 * It reads the game state through the hooks rather than through the context handed to the material description:
 * selecting one square changes what every other square offers, and only the hooks refresh a square whose own item
 * did not change.
 */
export const ActionZoneTileButton = ({ index }: { index: number }) => {
  const rules = useRules<LedaRules>()
  const player = usePlayerId<number>()
  const play = usePlay<MaterialMove<number, MaterialType, LocationType>>()
  const playAll = (moves: MaterialMove<number, MaterialType, LocationType>[]) => moves.forEach((move) => play(move, { transient: true }))

  // Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
  if (!rules || player === undefined) return null
  if (rules.game.rule?.id !== RuleId.ChooseAction || rules.getActivePlayer() !== player) return null

  const item = rules.material(MaterialType.Tile).getItem(index)
  if (item.selected) {
    // Whichever square of the selection it is clicked on, the button drops the selection whole.
    return (
      <LedaMenuButton filled x={buttonOffset} y={buttonOffset} onClick={() => playAll(clearSelectionMoves(rules))}>
        <FontAwesomeIcon icon={faXmark} />
      </LedaMenuButton>
    )
  }

  const cell = cellOf(item.location)
  if (!canSelectCell(rules, player, cell)) return null
  return (
    <LedaMenuButton x={buttonOffset} y={buttonOffset} onClick={() => playAll(selectCellMoves(rules, player, cell))}>
      <FontAwesomeIcon icon={faCheck} />
    </LedaMenuButton>
  )
}
