import { css } from '@emotion/react'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { Effect, Effects } from '@gamepark/leda/material/Effect'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { effectQuantity, pendingChoices } from '@gamepark/leda/rules/effects'
import { PlayMoveButton, usePlayerId, useRules } from '@gamepark/react-game'
import { getEnumValues, MaterialMoveBuilder, XYCoordinates } from '@gamepark/rules-api'
import { Fragment } from 'react'
import { EffectIcon } from './EffectIcon'

/**
 * An "OR": what the branches give, written the way the cards print it rather than in words, since nothing here is
 * text. Any clan may write one, so this header is the one of every such choice (see {@link ChooseEffectRule}).
 *
 * The branches are buttons for the player being asked, and plain symbols for everybody else, which tells them what
 * that player is picking between. `from` is what the choice was reached through, when it was reached through
 * something: a special activation reads "1 crystal = 1 Food OR 1 Awakening", and the crystal is half of it.
 */
export const ChooseEffectHeader = () => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  const choice = rules === undefined ? undefined : pendingChoices(rules)[0]
  const player = rules?.getActivePlayer()
  if (rules === undefined || choice === undefined || player === undefined) return null
  // What the branches give is read for the player being asked, whoever is looking at the table.
  const icons = (branch: Effects) => <EffectIcons effects={branch} rules={rules} player={player} cell={choice.cell} />
  return (
    <span css={line}>
      {choice.from !== undefined && (
        <>
          <EffectIcon effect={choice.from} /> =
        </>
      )}
      {choice.or.map((branch, branchIndex) => (
        <Fragment key={branchIndex}>
          {branchIndex > 0 && '/'}
          {player === me ? (
            <PlayMoveButton move={MaterialMoveBuilder.customMove(CustomMoveType.ChooseEffect, branchIndex)} css={choiceButton}>
              {icons(branch)}
            </PlayMoveButton>
          ) : (
            icons(branch)
          )}
        </Fragment>
      ))}
    </span>
  )
}

/**
 * What a branch gives, one symbol per time it gives it: 2 military symbols are 2 crossed swords, as on the cards.
 * How many times is asked of the rules, since a card may read it off the game rather than print it.
 */
const EffectIcons = ({ effects, rules, player, cell }: { effects: Effects; rules: LedaRules; player: number; cell?: XYCoordinates }) => (
  <>
    {getEnumValues(Effect).flatMap((effect) =>
      Array.from({ length: effectQuantity(rules, player, effects[effect], cell) }, (_, time) => <EffectIcon key={`${effect}-${time}`} effect={effect} />)
    )}
  </>
)

/**
 * The gaps hold the line together whether its halves are buttons or plain symbols, and the height is what keeps it
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
 * The branches are cut to one size rather than to the symbols each holds: they are the faces of one choice, and
 * one of them being bigger than the others would read as one of them mattering more.
 * Sized in an em of their own, smaller than the title, so that the symbols inside follow along: their height is
 * given in em too, and nothing has to be said twice.
 */
const choiceButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2em;
  font-size: 0.75em;
  height: 1.7em;
  min-width: 2.6em;
`
