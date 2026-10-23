import { css } from '@emotion/react'
import { eggCost } from '@gamepark/leda/rules/snake'
import { Dialog, ThemeButton } from '@gamepark/react-game'
import { Trans, useTranslation } from 'react-i18next'
import { FoodIcon } from '../headers/FoodIcon'

type HatchEggCostDialogProps = {
  open: boolean
  close: () => void
}

/**
 * Why an Egg of the zone carries a crossed out medallion rather than a shining one: hatching it costs Food its owner
 * does not have (see {@link unaffordableEggCells}).
 */
export const HatchEggCostDialog = ({ open, close }: HatchEggCostDialogProps) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <p css={text}>
          <Trans i18nKey="hatching.cost" values={{ count: eggCost }} components={{ food: <FoodIcon /> }} />
        </p>
        <div css={buttons}>
          <ThemeButton onClick={close}>{t('Close', { ns: 'common' })}</ThemeButton>
        </div>
      </div>
    </Dialog>
  )
}

/** The same layout as every other dialog of the game (see {@link ActivationLockDialog}). */
const content = css`
  padding: 2em 3em;
`

const text = css`
  margin: 0 0 1.5em;
  font-size: 2em;
  max-width: 26em;
  line-height: 1.3;
`

const buttons = css`
  display: flex;
  justify-content: center;
  font-size: 2em;
`
