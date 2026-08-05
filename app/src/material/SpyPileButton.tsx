import { faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { spiablePile, spiedItem } from '@gamepark/leda/rules/spy'
import { useTranslation } from 'react-i18next'
import { LedaMenuButton } from './LedaMenuButton'
import { useMenuButtonRules } from './menuButtons'
import { spyButtonX } from './spiedItem'

/**
 * The button the first item of a pile carries while a Spy effect is waiting for the player to pick one.
 * Like the buttons of a grid, it reads the state through the hooks rather than through the context handed to the
 * material description: the piles are only re-rendered when their own items change, which the rules moving on to
 * a Spy is not.
 */
export const SpyPileButton = ({ type, index }: { type: MaterialType; index: number }) => {
  const context = useMenuButtonRules()
  const { t } = useTranslation()

  if (context === undefined) return null
  const { rules, player: me } = context
  if (rules.getActivePlayer() !== me) return null
  if (rules.game.rule?.id !== RuleId.Spy || spiedItem(rules) !== undefined) return null
  if (spiablePile(rules, me, type, index) === undefined) return null

  return (
    <LedaMenuButton
      move={rules.material(type).index(index).moveItem({ type: LocationType.SpiedItem, player: me })}
      label={t('spy.look')}
      x={spyButtonX(type)}
      labelPosition="right"
    >
      <FontAwesomeIcon icon={faEye} />
    </LedaMenuButton>
  )
}
