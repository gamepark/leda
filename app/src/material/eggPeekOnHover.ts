import { css } from '@emotion/react'

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
