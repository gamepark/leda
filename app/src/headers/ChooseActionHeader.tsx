import { LedaRules } from '@gamepark/leda/LedaRules'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { HeaderText, PlayMoveButton, usePlay, usePlayerId, useRules } from '@gamepark/react-game'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { clearSelectionMoves, selectedZone } from '../material/actionZoneSelection'

/**
 * The player selects the squares to activate in their grid (see {@link ActionZoneTileButton}), then validates.
 * The button stays disabled until the selection designates one zone: before that, none of the moves the rules
 * offer is the one the player means.
 */
export const ChooseActionHeader = () => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  const play = usePlay()
  const zone = rules && me !== undefined ? selectedZone(rules, me) : undefined

  // The selection is local: playing the zone does not clear it, so the button does it on its way out.
  const clearSelection = () => rules && clearSelectionMoves(rules).forEach((move) => play(move, { transient: true }))

  return (
    <HeaderText
      code="choose-action"
      components={{
        validate: (
          <PlayMoveButton move={zone !== undefined ? MaterialMoveBuilder.customMove(CustomMoveType.ChooseAction, zone) : undefined} onPlay={clearSelection} />
        )
      }}
    />
  )
}
