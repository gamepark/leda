import { css } from '@emotion/react'
import { Effect } from '@gamepark/leda/material/Effect'
import { Picture } from '@gamepark/react-game'
import DrawImage from '../images/icons/Draw.png'
import FlipImage from '../images/icons/Flip.png'
import MilitaryImage from '../images/icons/Military.png'
import SpecialActivationImage from '../images/icons/SpecialActivation.png'
import SpyImage from '../images/icons/Spy.png'
import UpgradeImage from '../images/icons/Upgrade.png'
import FoodImage from '../images/tokens/food.png'
import { AwakeningIcon } from './AwakeningIcon'

/**
 * The symbol the game prints for an effect, drawn inline where a text would name it. The rules speak in symbols
 * and so does the table, so anything that has to tell what an effect gives can say it with one of these.
 *
 * The Awakening is the odd one out: it is black line art, and it is drawn as a mask so that it takes the color of
 * the text it sits in (see {@link AwakeningIcon}). The others are the coloured symbols of the material.
 */
const effectImages: Partial<Record<Effect, string>> = {
  [Effect.Food]: FoodImage,
  [Effect.Draw]: DrawImage,
  [Effect.Military]: MilitaryImage,
  [Effect.Upgrade]: UpgradeImage,
  [Effect.SpecialActivation]: SpecialActivationImage,
  [Effect.Spy]: SpyImage,
  [Effect.Flip]: FlipImage
}

/** Nothing is drawn for an effect with no symbol of its own, which no choice offers so far. */
export const EffectIcon = ({ effect }: { effect: Effect }) => {
  if (effect === Effect.Awakening) return <AwakeningIcon />
  const image = effectImages[effect]
  return image === undefined ? null : <Picture src={image} css={icon} alt="" />
}

/**
 * The doubled selector is what makes the height win: the header sizes every image it holds (`h1 img`), which is
 * one class more than a plain rule here.
 */
const icon = css`
  && {
    height: 1.3em;
    top: 0;
  }
`
