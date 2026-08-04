import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf } from '@gamepark/leda/material/PlayerGrid'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { topCardOn } from '@gamepark/leda/rules/playedCards'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { LedaMenuButton } from './LedaMenuButton'
import { TileButtonProps } from './TileMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * A card asking for a tile to be activated out of turn, and outside the zone of the round: every bare tile of the
 * grid carries the button, a Desert included, since the upgrade that follows may be what the player is after.
 * A tile under a card carries none: what the card asks for is the tile, which that card covers
 * (see {@link ActivateAndUpgradeTileRule}).
 */
export const ActivateAndUpgradeTileButton = ({ index, rules, player }: TileButtonProps) => {
  const cell = cellOf(rules.material(MaterialType.Tile).getItem(index).location)
  if (topCardOn(rules, player, cell) !== undefined) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={MaterialMoveBuilder.customMove(CustomMoveType.ActivateSquare, cell)}>
      <FontAwesomeIcon icon={faBolt} />
    </LedaMenuButton>
  )
}
