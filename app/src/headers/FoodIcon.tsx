import { css } from '@emotion/react'
import { Picture } from '@gamepark/react-game'
import FoodTokenImage from '../images/tokens/food.png'

/** The Food token, drawn inline in a sentence of the header, where a text would name the resource. */
export const FoodIcon = () => <Picture src={FoodTokenImage} css={inlineToken} alt="" />

/**
 * Sized off the text rather than off the table: the header has a font size of its own, and the token has to read
 * as one word of the sentence it sits in. Nudged down so that its center lands on the middle of the lowercase
 * letters rather than on the baseline.
 *
 * The doubled selector is what makes these rules win: the header sizes every image it holds (`h1 img`), which is
 * one class more than a plain rule here, and would leave the height below without effect.
 */
const inlineToken = css`
  && {
    height: 1.4em;
    top: 0;
    vertical-align: -0.3em;
  }
`
