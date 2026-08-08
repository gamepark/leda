import { LedaRules } from '@gamepark/leda/LedaRules'
import { pendingChoices } from '@gamepark/leda/rules/effects'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { CustomMove, XYCoordinates } from '@gamepark/rules-api'
import { EffectIcons } from '../../headers/ChooseEffectHeader'
import { LogText } from '../LogText'
import { SquareMaterial } from './SquareMaterial'

/** What a player designates while a zone is being activated: a square, a branch of an "OR", or nothing at all. */

/**
 * A square is activated. Which rule asked for it is what the sentence says, since the rulebook tells them apart:
 * the zone of the round resolves what stands on a square, and the cards that ask for one name a card, a tile or a
 * Desert (see {@link CustomMoveType.ActivateSquare}).
 */
const activationCodes: Partial<Record<RuleId, string>> = {
  [RuleId.ActivateZone]: 'log.activate',
  [RuleId.ActivateCard]: 'log.activate-card',
  [RuleId.ActivateTile]: 'log.activate-tile',
  [RuleId.ActivateAndUpgradeTile]: 'log.activate-and-upgrade-tile',
  [RuleId.ActivateDesert]: 'log.activate-desert',
  [RuleId.CopyOpponentCard]: 'log.copy'
}

/** The rules that reach a tile and never the card played over it (see {@link bareCells}, {@link visibleDesertCells}). */
const tileRules: RuleId[] = [RuleId.ActivateTile, RuleId.ActivateAndUpgradeTile, RuleId.ActivateDesert]

/** The rule of a game is only ever numbered, so the table it is read in is reached through a typed door. */
const codeOf = (codes: Partial<Record<RuleId, string>>, rule: RuleId): string | undefined => codes[rule]

export const ActivateSquareLog = ({ move, context }: MaterialLogProps<CustomMove>) => {
  const rules = new LedaRules(context.game)
  const rule = context.game.rule
  const player = usePlayerName(rule?.player)
  const cell = move.data as XYCoordinates | undefined
  const code = rule?.id === undefined ? undefined : codeOf(activationCodes, rule.id)
  if (code === undefined || cell === undefined || rule?.player === undefined) return null
  /** A copy is read on the square of the opponent, which is where the card being copied stands. */
  const owner = rule.id === RuleId.CopyOpponentCard ? (rules.game.players.find((other) => other !== rule.player) ?? rule.player) : rule.player
  return (
    <LogText
      code={code}
      values={{ player }}
      components={{ material: <SquareMaterial rules={rules} player={owner} cell={cell} card={!tileRules.includes(rule.id)} /> }}
    />
  )
}

/**
 * An "OR": what the player picked, written with the symbols they picked between rather than in words, exactly as
 * the header offered them (see {@link ChooseEffectHeader}). The choice is read off the state before the move,
 * which is the only one it is still waiting in.
 */
export const ChooseEffectLog = ({ move, context }: MaterialLogProps<CustomMove>) => {
  const rules = new LedaRules(context.game)
  const player = context.game.rule?.player
  const name = usePlayerName(player)
  const choice = pendingChoices(rules)[0]
  const branch = choice?.or[move.data as number]
  if (branch === undefined || player === undefined) return null
  return (
    <LogText
      code="log.choose-effect"
      values={{ player: name }}
      components={{ effects: <EffectIcons effects={branch} rules={rules} player={player} source={choice} /> }}
    />
  )
}

/**
 * A player turns down what they were only allowed to do, rather than told to. Which chance they are turning down
 * is the rule they are in: the moves all look the same, and only what was being offered tells them apart.
 */
const passCodes: Partial<Record<RuleId, string>> = {
  [RuleId.Mulligan]: 'log.keep-hand',
  [RuleId.PlayCard]: 'log.pass.play-card',
  [RuleId.SpendRingForToken]: 'log.pass.spend-ring',
  [RuleId.RotateCatCard]: 'log.pass.rotate',
  [RuleId.PlaceRing]: 'log.pass.place-ring'
}

export const PassLog = ({ move, context }: MaterialLogProps<CustomMove>) => {
  const rule = context.game.rule
  /** Every pass but the one of a card offered carries its player: several may pass at once (see {@link CustomMoveType.Pass}). */
  const player = usePlayerName((move.data as number | undefined) ?? rule?.player)
  const code = rule?.id === undefined ? undefined : codeOf(passCodes, rule.id)
  return code === undefined ? null : <LogText code={code} values={{ player }} />
}
