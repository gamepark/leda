import { LedaRules } from '@gamepark/leda/LedaRules'
import { activableCells } from '@gamepark/leda/rules/activation'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { bareCells, visibleDesertCells } from '@gamepark/leda/rules/tileChoices'
import { usePlayerId, useRules } from '@gamepark/react-game'
import { ActivateSquareOnTile } from './ActivateSquareButton'
import { ChooseActionTileButton } from './ChooseActionTileButton'
import { DowngradeTileButton } from './DowngradeTileButton'
import { FlipDesertButton } from './FlipDesertButton'
import { PlaceSharkTokenButton } from './PlaceSharkTokenButton'
import { UpgradeAndActivateTileButton } from './UpgradeAndActivateTileButton'
import { UpgradeTileButton } from './UpgradeTileButton'

export type TileButtonProps = {
  /** Index of the tile in the game state, which is stable, unlike the item a stale render would carry. */
  index: number
  rules: LedaRules
  player: number
}

/**
 * The button a square of the player's own grid carries, whatever the rules are waiting for.
 * It reads the state through the hooks rather than through the context handed to the material description: the
 * squares of a grid are only re-rendered when their own item changes, which is far from every time their button
 * has to change.
 */
export const TileMenuButton = ({ index }: { index: number }) => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  // Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
  if (!rules || me === undefined || rules.getActivePlayer() !== me) return null

  switch (rules.game.rule?.id) {
    case RuleId.ChooseAction:
      return <ChooseActionTileButton index={index} rules={rules} player={me} />

    /** The 3 rules that have a player activate a square, which only differ in the squares they offer. */
    case RuleId.ActivateZone:
      return <ActivateSquareOnTile index={index} rules={rules} cells={activableCells(rules, me)} />
    case RuleId.ActivateAndUpgradeTile:
    case RuleId.ActivateTile:
      return <ActivateSquareOnTile index={index} rules={rules} cells={bareCells(rules, me)} />
    case RuleId.ActivateDesert:
      return <ActivateSquareOnTile index={index} rules={rules} cells={visibleDesertCells(rules, me)} />

    case RuleId.UpgradeTile:
      return <UpgradeTileButton index={index} rules={rules} player={me} />
    case RuleId.UpgradeAndActivateTile:
      return <UpgradeAndActivateTileButton index={index} rules={rules} player={me} />
    case RuleId.FlipDesert:
      return <FlipDesertButton index={index} rules={rules} player={me} />
    case RuleId.PlaceSharkToken:
      return <PlaceSharkTokenButton index={index} rules={rules} player={me} />
    /** The one rule where the player carrying the buttons is not the one whose card opened it. */
    case RuleId.DowngradeTile:
      return <DowngradeTileButton index={index} rules={rules} player={me} />
    default:
      return null
  }
}
