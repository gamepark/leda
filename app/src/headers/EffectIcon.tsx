import { css } from '@emotion/react'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { Effect, effectEntries, Effects, EffectSource } from '@gamepark/leda/material/Effect'
import { effectQuantity } from '@gamepark/leda/rules/effects'
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

/**
 * What a set of effects gives, one symbol per time it gives it: 2 military symbols are 2 crossed swords, as on
 * the cards. How many times is asked of the rules, since a card may read it off the game rather than print it.
 * Left to right in the order the set is written, which is the order it will be resolved in.
 *
 * Drawn wherever the branches of an "OR" are shown: in the header of the choice (see {@link ChooseEffectHeader}),
 * in the dialog that asks it (see {@link ChooseEffectDialog}), and in the journal, which says what a player
 * picked with the very symbols they picked between (see {@link ChooseEffectLog}).
 */
export const EffectIcons = ({ effects, rules, player, source }: { effects: Effects; rules: LedaRules; player: number; source?: EffectSource }) => (
  <>
    {effectEntries(effects).flatMap(([effect, quantity]) =>
      Array.from({ length: effectQuantity(rules, player, quantity, source) }, (_, time) => <EffectIcon key={`${effect}-${time}`} effect={effect} />)
    )}
  </>
)
