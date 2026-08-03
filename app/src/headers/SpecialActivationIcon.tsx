import { css } from '@emotion/react'
import { Picture } from '@gamepark/react-game'
import SpecialActivationImage from '../images/icons/SpecialActivation.png'

/**
 * The crystal a Special activation square shows, which each clan reads on its Victory condition card as "1 crystal
 * = ...". Drawn as an image and not as a mask like {@link AwakeningIcon}: the crystal is blue, its color is what
 * makes it recognizable.
 */
export const SpecialActivationIcon = () => <Picture src={SpecialActivationImage} css={inlineIcon} alt="" />

/** Doubled to outweigh the sizing the header applies to its images, exactly like {@link FoodIcon}. */
const inlineIcon = css`
  && {
    height: 1.3em;
    top: 0;
  }
`
