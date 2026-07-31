import { LedaRules } from '@gamepark/leda/LedaRules'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { usePlayerId, useRules } from '@gamepark/react-game'
import { ActivateTileButton } from './ActivateTileButton'
import { ChooseActionTileButton } from './ChooseActionTileButton'
import { FlipDesertButton } from './FlipDesertButton'
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
    case RuleId.ActivateZone:
      return <ActivateTileButton index={index} rules={rules} player={me} />
    case RuleId.UpgradeTile:
      return <UpgradeTileButton index={index} rules={rules} player={me} />
    case RuleId.FlipDesert:
      return <FlipDesertButton index={index} rules={rules} player={me} />
    default:
      return null
  }
}
