import { css } from '@emotion/react'
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
export const LedaMenuButton = ({ filled, size = ledaMenuButtonSize, accent, x = 0, y = 0, ...props }: LedaMenuButtonProps) => (
  <ItemMenuButton
    x={x}
    y={y}
    {...props}
    css={[
      medallion,
      medallionSize(size),
      filled && filledMedallion,
      accent !== undefined && accentMedallion(accent),
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
