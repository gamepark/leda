import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialHelpProps } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { HelpText, HelpTitle, Line, Note } from './helpLayout'

/**
 * The resource of the game: what it is spent on, and where it comes from. One text for every Food there is, the
 * reserve included, which the description shows as a fixed pile and which this is the help of: Food has no id and
 * no faces, and the reserve is not modelled at all (see {@link FoodTokenDescription}).
 */
export const FoodTokenHelp = (_props: MaterialHelpProps<number, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  return (
    <>
      <HelpTitle>{t('help.food.title')}</HelpTitle>
      <Line label={t('help.use')}>
        <HelpText code="help.food.use" />
      </Line>
      <Note code="help.note.food-gain" />
      <Note code="help.note.food-supply" />
    </>
  )
}
