import { css } from '@emotion/react'
import { ItemButtonProps, ItemMenuButton, transformCss } from '@gamepark/react-game'
import { HTMLAttributes } from 'react'
import { copper, copperActive, copperHover, copperLight, ink, parchment, parchmentDark } from '../theme'

type LedaMenuButtonProps = {
  /** A button standing for something already engaged: copper filled, where a button that offers something is parchment. */
  filled?: boolean
} & ItemButtonProps &
  HTMLAttributes<HTMLButtonElement>

/** How wide the medallion is, in centimeters of the table, for whoever has to leave room for one. */
export const ledaMenuButtonSize = 2.2

/**
 * The button of an item menu, as a parchment medallion in a copper rim: the frame that runs around the pages of
 * the rulebook, turned into a coin small enough to sit on a 7 cm tile.
 *
 * The css of the framework is replaced rather than completed, because the css prop given to ItemMenuButton takes
 * the place of its own, hence the transform below: it is the one ItemMenuButton applies to place itself on its item.
 */
export const LedaMenuButton = ({ filled, x = 0, y = 0, ...props }: LedaMenuButtonProps) => (
  <ItemMenuButton x={x} y={y} {...props} css={[medallion, filled && filledMedallion, transformCss('translate(-50%, -50%)', `translate(${x}em, ${y}em)`)]} />
)

const medallion = css`
  transform-style: preserve-3d;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${ledaMenuButtonSize}em;
  height: ${ledaMenuButtonSize}em;
  padding: 0;
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
  cursor: pointer;
  box-shadow:
    0 0.15em 0.35em rgba(0, 0, 0, 0.5),
    inset 0 0.08em 0.15em rgba(255, 255, 255, 0.55),
    inset 0 -0.08em 0.15em rgba(0, 0, 0, 0.18);
  transition:
    margin-top 0.15s ease-in-out,
    background-color 0.1s ease-in-out,
    color 0.1s ease-in-out;

  &:hover,
  &:focus {
    margin-top: -0.15em;
    background-color: ${copperLight};
  }

  &:active {
    background-color: ${copperActive};
    color: ${parchment};
  }

  /* The label of the framework is a white text on a dark box: on parchment it reads as a tag of the same page. */
  > span {
    border: 0.08em solid ${copper};
    border-radius: 0.3em;
    background: ${parchment};
    color: ${ink};
    font-weight: 700;
  }
`

const filledMedallion = css`
  border-color: ${parchmentDark};
  background-color: ${copper};
  color: ${parchment};

  &:hover,
  &:focus {
    background-color: ${copperHover};
  }

  &:active {
    background-color: ${parchment};
    color: ${ink};
  }
`
