import { css } from '@emotion/react'
import { Picture } from '@gamepark/react-game'
import FoodTokenImage from '../images/tokens/food.png'

/** The Food token, drawn inline in a sentence of the header, where a text would name the resource. */
export const FoodIcon = () => <Picture src={FoodTokenImage} css={inlineToken} alt="" />

/**
 * Sized off the text rather than off the table: the header has a font size of its own, and the token has to read
 * as one word of the sentence it sits in. Nudged down so that its center lands on the middle of the lowercase
 * letters rather than on the baseline.
 */
const inlineToken = css`
  height: 1.1em;
  vertical-align: -0.2em;
`
