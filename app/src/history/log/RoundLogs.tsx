import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { ActionZone } from '@gamepark/leda/material/ActionZone'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { canWinMilitaryVictory } from '@gamepark/leda/rules/effects'
import { conflictWinner, militarySymbols } from '@gamepark/leda/rules/militaryConflict'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { CustomMove, MaterialMove, MoveItem } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { LogText } from '../LogText'
import { MaterialLink } from '../MaterialLink'
import { revealedId } from '../logMaterial'

/** The 3 phases of a round, as far as any of them is something the players are told rather than something they do. */

/**
 * Phase 1 opens: the active player turns the first Action tile of the pile face up, which is what marks a new
 * round in the journal. Revealing is not a choice, so this is a consequence of the rule starting and not a move
 * of the player, but it is theirs all the same.
 */
export const RevealActionTileLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(context.game.rule?.player)
  const tile = new LedaRules(context.game).material(MaterialType.ActionTile).getItem<ActionTileId>(move.itemIndex)
  return (
    <LogText
      code="log.reveal-action"
      values={{ player }}
      components={{ material: <MaterialLink type={MaterialType.ActionTile} item={{ id: revealedId(move, tile) }} /> }}
    />
  )
}

/** Still phase 1: the active player picks one of the zones the tile offers, which both players will activate. */
export const ChooseActionLog = ({ move, context }: MaterialLogProps<CustomMove>) => {
  const { t } = useTranslation()
  const player = usePlayerName(context.game.rule?.player)
  return <LogText code="log.choose-action" values={{ player, zone: t(`zone.${move.data as ActionZone}`) }} />
}

/**
 * Phase 2: the military symbols the players gathered are compared, and the one who has the most takes the top
 * Military Victory token. What the token turns out to be is an entry of its own (see {@link WinTokenLog}).
 *
 * The 3 ways a round hands out nothing are told apart rather than lumped into one silence: a tie, a Scorpion Portal
 * that closed the round to tokens, and a pile that has run out. Whichever it is, the symbols were gathered and the
 * players are owed the reason they bought nothing.
 */
export const ConflictLog = ({ context }: MaterialLogProps<MaterialMove>) => {
  const rules = new LedaRules(context.game)
  const winner = conflictWinner(rules)
  const player = usePlayerName(winner)
  if (winner === undefined) return <LogText code="log.conflict.tie" />
  if (!canWinMilitaryVictory(rules)) return <LogText code="log.conflict.blocked" values={{ player }} />
  if (rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck).length === 0) {
    return <LogText code="log.conflict.empty" values={{ player }} />
  }
  const opponents = rules.game.players.filter((other) => other !== winner)
  return (
    <LogText
      code="log.conflict.won"
      values={{ player, symbols: militarySymbols(rules, winner), opponent: Math.max(0, ...opponents.map((other) => militarySymbols(rules, other))) }}
    />
  )
}
