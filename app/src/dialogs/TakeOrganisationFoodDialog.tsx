import { css } from '@emotion/react'
import { Dialog, PlayMoveButton, ThemeButton } from '@gamepark/react-game'
import { MaterialMove } from '@gamepark/rules-api'
import { Trans, useTranslation } from 'react-i18next'
import { FoodIcon } from '../headers/FoodIcon'

type TakeOrganisationFoodDialogProps = {
  open: boolean
  close: () => void
  takeFood: MaterialMove
}

/**
 * The Food of an organisation is what a player is paid for swapping 2 of their squares, and taking it without
 * swapping anything is allowed but wasteful. So the button beside the reserve does not play it: it opens this,
 * which spells the rule out, since a player who reads it and still takes the Food gives up their swap.
 */
export const TakeOrganisationFoodDialog = ({ open, close, takeFood }: TakeOrganisationFoodDialogProps) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <p css={text}>
          <Trans defaults={t('organisation.food.explain')} components={{ food: <FoodIcon /> }} />
        </p>
        <div css={buttons}>
          <ThemeButton onClick={close}>{t('organisation.food.cancel')}</ThemeButton>
          <PlayMoveButton move={takeFood} onPlay={close}>
            {t('organisation.food.take')} <FoodIcon />
          </PlayMoveButton>
        </div>
      </div>
    </Dialog>
  )
}

/** Colors come from the theme: the Dialog of the framework already applies its background and its text color. */
const content = css`
  padding: 2em 3em;
`

/** Wide enough for the sentence to read over 3 lines, and sized in the ems of the text itself rather than the dialog's. */
const text = css`
  margin: 0 0 1.5em;
  font-size: 2em;
  max-width: 30em;
`

const buttons = css`
  display: flex;
  justify-content: center;
  gap: 1.5em;
  font-size: 2em;
`
