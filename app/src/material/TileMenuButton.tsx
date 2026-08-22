import { LedaRules } from '@gamepark/leda/LedaRules'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { ActivateSquareOnTile } from './ActivateSquareButton'
import { ChooseActionTileButton } from './ChooseActionTileButton'
import { DowngradeTileButton } from './DowngradeTileButton'
import { FlipDesertButton } from './FlipDesertButton'
import { useMenuButtonRules } from './menuButtons'
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
 * The button a square of a grid carries, whatever the rules are waiting for.
 * What it reads is the state nothing is still catching up with (see {@link useMenuButtonRules}): for as long as
 * anything is being shown, the squares carry no button at all. Pressing one is what starts an animation, so the
 * buttons of the whole grid go away the moment the player presses one, and only come back once the rules have
 * moved on and the table has been told about it.
 */
export const TileMenuButton = ({ index, owner }: { index: number; owner: number }) => {
  const context = useMenuButtonRules()
  if (context === undefined) return null
  const { rules, player: me } = context
  if (rules.getActivePlayer() !== me) return null

  /**
   * The squares of the opponent, which one rule and one rule only ever asks about: a Cat card copying a square of
   * theirs is answered over there, on the bare squares as well as on the cards (see {@link CopyOpponentCardRule}).
   * Every other button is about the grid of the player pressing it, and their own grid says nothing during that
   * rule: the squares are only ever named by their coordinates, so whose grid they are in has to be asked here.
   */
  if (owner !== me) {
    if (rules.game.rule?.id !== RuleId.CopyOpponentCard) return null
    return <ActivateSquareOnTile index={index} rules={rules} player={me} />
  }

  switch (rules.game.rule?.id) {
    case RuleId.ChooseAction:
      return <ChooseActionTileButton index={index} rules={rules} player={me} />

    /** The 4 rules that have a player activate a square of their own grid, whichever squares they offer. */
    case RuleId.ActivateZone:
    case RuleId.ActivateAndUpgradeTile:
    case RuleId.ActivateTile:
    case RuleId.ActivateDesert:
      return <ActivateSquareOnTile index={index} rules={rules} player={me} />

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
