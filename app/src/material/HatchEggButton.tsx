import { faEgg } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { LedaMenuButton } from './LedaMenuButton'
import { offeredCells, useMenuButtonRules } from './menuButtons'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The medallion an Egg of the zone carries: 2 Food to hatch it, which turns it onto its Snake side and activates
 * the square on the spot (see {@link ActivateZoneRule}).
 *
 * In the corner every square carries its action in, and never beside one: an Egg gives nothing until it hatches,
 * so its square is never one the zone offers to activate, and the 2 buttons are never on the same card
 * (see {@link ActivateSquareButton}).
 *
 * Which Eggs are offered is read off the moves the rules hand the player, like every other button of the table,
 * so a player who cannot pay for one is offered nothing (see {@link offeredCells}).
 */
export const HatchEggButton = ({ index }: { index: number }) => {
  const context = useMenuButtonRules()
  if (context === undefined) return null
  const { rules, player: me } = context
  if (rules.getActivePlayer() !== me) return null
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  if (card.location.player !== me || card.location.parent === undefined) return null
  const cell = cellOf(rules.material(MaterialType.Tile).getItem(card.location.parent).location)
  if (!offeredCells(rules, me, CustomMoveType.HatchEgg).some((hatchable) => sameCell(hatchable, cell))) return null
  // No label, like every other button of a grid: 4 squares of a zone side by side leave no room for one, and
  // what an Egg costs is said by the header for as long as one may be opened (see {@link ActivateZoneHeader}).
  return (
    <LedaMenuButton {...tileButtonPosition} move={MaterialMoveBuilder.customMove(CustomMoveType.HatchEgg, cell)}>
      <FontAwesomeIcon icon={faEgg} />
    </LedaMenuButton>
  )
}
