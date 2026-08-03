import { css } from '@emotion/react'
import { useState } from 'react'
import { AwakeningRuleDialog } from '../dialogs/AwakeningRuleDialog'
import { AwakeningIcon } from '../headers/AwakeningIcon'
import { copper, ink, parchment } from '../theme'

/**
 * The Awakenings a player gathered while activating their zone and has not resolved yet. They are written down
 * rather than played out, so nothing on the table would show them: this badge, over the panel of their owner, is
 * where they are counted, one symbol each.
 * The rule they are waiting for is not obvious, hence the dialog a click opens (see {@link AwakeningRuleDialog}).
 */
export const AwakeningReminder = ({ awakenings }: { awakenings: number }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div css={badge} onClick={() => setOpen(true)}>
        {Array.from({ length: awakenings }, (_, index) => (
          <AwakeningIcon key={index} />
        ))}
      </div>
      <AwakeningRuleDialog open={open} close={() => setOpen(false)} />
    </>
  )
}

/**
 * The parchment of the panel it sits over, framed like the dialogs of the game. Sized in ems of the table, where
 * the panel is 28em wide, so that it holds a whole hand of Awakenings without ever reaching that width.
 */
const badge = css`
  display: flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.2em 0.6em;
  border-radius: 2em;
  background: ${parchment};
  border: 0.08em solid ${copper};
  box-shadow: 0 0 0.5em black;
  color: ${ink};
  font-size: 3em;
  cursor: pointer;

  &:hover {
    background: ${copper};
    color: ${parchment};
  }
`
