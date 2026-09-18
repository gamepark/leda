import { css } from '@emotion/react'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { useActions } from '@gamepark/react-game'
import { isCustomMoveType } from '@gamepark/rules-api'
import { ReactNode } from 'react'
import { tableIsLate } from './menuButtons'

/**
 * What lets the owner of an Egg turn it face up under the pointer, to read which Snake it is without opening the
 * help: the 2 faces of a Snake card whose front its reader knows, wrapped in one more layer that the hover turns
 * a half turn (see {@link eggPeekOnHover}). The opponent has no front to read, and is handed no wrapper.
 *
 * Not while an Egg is hatching: the pointer is on the card that was just clicked, and it would be shown face up
 * while the 2 Food are paid, before the card turns over on its own. The actions are read through a hook, which
 * the description cannot do: an item is only drawn again when its own item changes, and the payment leaves the
 * card alone (see {@link useMenuButtonRules}).
 */
export const EggPeek = ({ children }: { children: ReactNode }) => {
  const actions = useActions()
  const hatching = actions?.some((action) => isCustomMoveType(CustomMoveType.HatchEgg)(action.move) && tableIsLate(action))
  return (
    <div css={peekCss} data-egg-peek={hatching ? undefined : ''}>
      {children}
    </div>
  )
}

const peekCss = css`
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform-origin: center;
`

/**
 * The hover itself, given to an Egg on the table alone (see {@link ClanCardDescription.getItemExtraCss}): a help
 * dialog draws the same wrapper, and already shows the front of its owner's Egg. It is read off the item the
 * framework hovers, which is 2 levels above the card's faces, the card being turned onto its back already: another
 * half turn is what brings the front up.
 */
export const eggPeekOnHover = css`
  @media (hover) {
    *:hover > & > * > [data-egg-peek] {
      transition: transform 50ms ease-in-out;
      transform: rotateY(180deg);
    }
  }
`
