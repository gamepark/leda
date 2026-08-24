import { css } from '@emotion/react'
import { copper, ink, parchment } from '../theme'

/**
 * The face of a medallion, without any of what makes it a button: the coin as it is struck. Held apart from the
 * button so that a mark which is read rather than pressed is the very same coin as the one that is pressed
 * (see {@link LedaMenuButton}, {@link ChooseClanDialog}).
 */
export const medallionFace = css`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.12em solid ${copper};
  border-radius: 50%;
  /**
   * The light of the medallion is an image, its tint a color, so that hovering only animates the color: a
   * background shorthand going from a gradient to a flat color drops the gradient halfway through the transition,
   * while the color underneath is still half transparent, which reads as the button blinking out.
   */
  background-color: ${parchment};
  background-image: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.45) 0%, rgba(0, 0, 0, 0.15) 80%);
  color: ${ink};
  box-shadow:
    0 0.15em 0.35em rgba(0, 0, 0, 0.5),
    inset 0 0.08em 0.15em rgba(255, 255, 255, 0.55),
    inset 0 -0.08em 0.15em rgba(0, 0, 0, 0.18);
`
