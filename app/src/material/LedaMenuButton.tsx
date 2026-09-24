import { css, keyframes } from '@emotion/react'
import { ItemButtonProps, ItemMenuButton, transformCss } from '@gamepark/react-game'
import { HTMLAttributes } from 'react'
import { copper, copperActive, copperHover, copperLight, ink, parchment, parchmentDark } from '../theme'
import { medallionFace } from './medallion'

type LedaMenuButtonProps = {
  /** A button standing for something already engaged: copper filled, where a button that offers something is parchment. */
  filled?: boolean
  /** How wide the medallion is, for the rare button that has more than one symbol to show. */
  size?: number
  /** The color of the rim, for a button standing for something that is drawn in a color of its own on the table. */
  accent?: string
  /** The label laid across the bottom of the medallion, rather than beside it where the framework puts it. */
  labelBanner?: boolean
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
export const LedaMenuButton = ({ filled, size = ledaMenuButtonSize, accent, labelBanner, x = 0, y = 0, ...props }: LedaMenuButtonProps) => (
  <ItemMenuButton
    x={x}
    y={y}
    {...props}
    css={[
      medallion,
      medallionSize(size),
      filled && filledMedallion,
      accent !== undefined && accentMedallion(accent),
      labelBanner && bannerLabel,
      !filled && (props.move !== undefined || props.moves !== undefined) && pulse(accent ?? copper),
      transformCss('translate(-50%, -50%)', `translate(${x}em, ${y}em)`)
    ]}
  />
)

const medallionSize = (size: number) => css`
  width: ${size}em;
  height: ${size}em;
`

const medallion = css`
  ${medallionFace};
  transform-style: preserve-3d;
  padding: 0;
  cursor: pointer;
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

/**
 * The rim takes the color of what the button names, and its color alone: a medallion is a coin, and a coin has a
 * rim rather than a line drawn around it. What ties the button to its zone whatever a player reads of the colors
 * is the zone drawn inside it (see {@link ZoneIcon}).
 */
const accentMedallion = (accent: string) => css`
  border: 0.22em solid ${accent};
`

/**
 * A ring leaving the rim of a button that plays a move, and fading as it widens: at rest, a medallion is the very
 * coin a mark that is only read is struck as (see {@link medallionFace}), and hovering it is the only other sign
 * that it can be pressed, which a touch screen never shows. The ring is that sign, for everyone and all the time.
 *
 * Only a button that plays a move carries it: such a button is only there while the rules offer that move (see
 * {@link offeredCells}), so a ring never beats around something there is nothing to do with. A button that opens a
 * dialog to read what happened does not beat.
 * The ring is drawn apart from the coin, so the shadow of the medallion stays the one of a coin lying on the table.
 */
const pulse = (color: string) => css`
  &::after {
    content: '';
    position: absolute;
    inset: -0.22em;
    border: 0.18em solid ${color};
    border-radius: 50%;
    pointer-events: none;
    animation: ${pulseRing} 1.6s ease-out infinite;
  }

  /* Without motion, the ring stays where it would start from, and still says the same thing. */
  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
      opacity: 0.6;
    }
  }
`

const pulseRing = keyframes`
  from {
    transform: scale(1);
    opacity: 0.9;
  }
  to {
    transform: scale(1.45);
    opacity: 0;
  }
`

/**
 * A label across the bottom of the coin, like the ribbon under a seal: it stays inside the square the medallion
 * sits on, where a label beside it would spill over the next square of the grid.
 * The selector is doubled to outweigh the side placement of the framework, which comes with the same specificity.
 */
const bannerLabel = css`
  && > span {
    top: auto;
    left: 50%;
    right: auto;
    bottom: -0.6em;
    padding: 0 0.4em;
    font-size: 0.75em;
    transform: translateX(-50%) translateZ(0.1em);
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
