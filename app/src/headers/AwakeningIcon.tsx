import { css } from '@emotion/react'
import { HTMLAttributes } from 'react'
import AwakeningImage from '../images/icons/Awakening.png'

/**
 * The Awakening symbol, the one printed on the Panda cards that are paid with one.
 *
 * The icon is black line art, and it has to read over the dark bar of the header as well as over the parchment of a
 * player panel, or inside a button whose label turns from parchment to ink on hover. So it is not drawn as an image
 * but as a mask filled with the current text color: wherever it is written, it is the color of the text around it.
 */
export const AwakeningIcon = (props: HTMLAttributes<HTMLSpanElement>) => <span css={icon} {...props} />

/** The aspect ratio is the one of the source image, so that only the height ever has to be given. */
const icon = css`
  display: inline-block;
  height: 1.2em;
  aspect-ratio: 63 / 55;
  vertical-align: -0.25em;
  background-color: currentColor;
  mask: url(${AwakeningImage}) no-repeat center / contain;
`
