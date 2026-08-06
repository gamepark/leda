import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { placedSharkTokens, sharkTokens } from '@gamepark/leda/rules/sharkPack'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { CustomMove, MoveItem } from '@gamepark/rules-api'
import { LogText } from '../LogText'
import { MaterialLink } from '../MaterialLink'
import { revealedId } from '../logMaterial'

/** The 2 kinds of token a player collects: the Military Victory tokens, and the Shark tokens of their own clan. */

/**
 * A Military Victory token won: the top one of the pile, drawn face down and revealed by the very move that hands
 * it over, so both players read which one it is.
 */
export const WinTokenLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(move.location.player)
  const token = new LedaRules(context.game).material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(move.itemIndex)
  return (
    <LogText
      code="log.win-token"
      values={{ player }}
      components={{ material: <MaterialLink type={MaterialType.MilitaryVictoryToken} item={{ id: revealedId(move, token) }} /> }}
    />
  )
}

/** A token whose effect was of no use, put back under the pile to draw another one (see {@link RedrawMilitaryVictoryRule}). */
export const RedrawTokenLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const token = new LedaRules(context.game).material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(move.itemIndex)
  const player = usePlayerName(token?.location.player)
  return (
    <LogText code="log.redraw-token" values={{ player }} components={{ material: <MaterialLink type={MaterialType.MilitaryVictoryToken} item={token} /> }} />
  )
}

/** A token already won giving what it gave all over again, and staying where it is. */
export const TriggerTokenLog = ({ move, context }: MaterialLogProps<CustomMove>) => {
  const player = usePlayerName(context.game.rule?.player)
  const index = move.data as number | undefined
  if (index === undefined) return null
  const token = new LedaRules(context.game).material(MaterialType.MilitaryVictoryToken).getItem<MilitaryVictoryTokenId>(index)
  return (
    <LogText code="log.trigger-token" values={{ player }} components={{ material: <MaterialLink type={MaterialType.MilitaryVictoryToken} item={token} /> }} />
  )
}

/**
 * A Shark token placed on a square of its owner's grid, whether a card asked for it or a Shark card played took
 * one out of the supply on its own (see {@link sharkMoves}). All 9 of them in play win the game.
 */
export const PlaceSharkTokenLog = ({ move, context }: MaterialLogProps<MoveItem>) => {
  const player = usePlayerName(move.location.player)
  const placed = placedSharkTokens(new LedaRules(context.game), move.location.player!).getQuantity()
  return <LogText code="log.shark-token" values={{ player, count: placed + (move.quantity ?? 1), goal: sharkTokens }} />
}
