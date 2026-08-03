import { css } from '@emotion/react'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { PandaSpecialActivation } from '@gamepark/leda/rules/specialActivation'
import { PlayMoveButton, usePlayerId, useRules } from '@gamepark/react-game'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { AwakeningIcon } from './AwakeningIcon'
import { FoodIcon } from './FoodIcon'
import { SpecialActivationIcon } from './SpecialActivationIcon'

const choose = (choice: PandaSpecialActivation) => MaterialMoveBuilder.customMove(CustomMoveType.ChooseSpecialActivation, choice)

/**
 * What the Victory condition card of the Pandas reads, written the way it is printed on it rather than in words:
 * 1 crystal is 1 Food or 1 Awakening. Nothing here is translated, since nothing here is text.
 *
 * The choice is answered in the header itself, neither half of it being a place on the table one could click: an
 * Awakening has no material of its own. The other players read the same line without the buttons, which tells them
 * what the player whose turn it is has to pick between.
 */
export const PandaSpecialActivationHeader = () => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  const myChoice = me !== undefined && rules?.getActivePlayer() === me
  if (!myChoice) {
    return (
      <span css={line}>
        <SpecialActivationIcon /> = <FoodIcon /> / <AwakeningIcon />
      </span>
    )
  }
  return (
    <span css={line}>
      <SpecialActivationIcon /> =
      <PlayMoveButton move={choose(PandaSpecialActivation.Food)} css={choiceButton}>
        <FoodIcon />
      </PlayMoveButton>
      /
      <PlayMoveButton move={choose(PandaSpecialActivation.Awakening)} css={choiceButton}>
        <AwakeningIcon />
      </PlayMoveButton>
    </span>
  )
}

/**
 * The gaps hold the line together whether its halves are buttons or plain icons, and the height is what keeps it
 * inside the bar: that bar is 7em tall and its title 4.5em of those, so a line growing with its content hangs
 * below and is cut off (the bar hides what overflows).
 */
const line = css`
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  height: 1.3em;
  vertical-align: middle;
`

/**
 * Both halves of the choice, cut to one size rather than to the icon each holds: they are the two faces of one
 * choice, and one of them being taller than the other would read as one of them mattering more.
 * Sized in an em of their own, smaller than the title, so that the icons inside follow along: their height is
 * given in em too, and nothing has to be said twice.
 */
const choiceButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75em;
  height: 1.7em;
  width: 2.6em;
`
