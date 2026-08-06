import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { sharkTokens } from '@gamepark/leda/rules/sharkPack'
import { MaterialHelpProps } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { HelpText, HelpTitle, Line, Note } from './helpLayout'

/**
 * The tokens of the Shark clan: how one reaches the grid, what having 2 of them around a square does, and the fact
 * that placing the last one wins the game. They have no id and no faces, so there is one text for the 9 of them.
 *
 * Which slot of a card a token sits on is not said here: the token slides on its own as the board changes around
 * it (see {@link sharkPack}), and the card underneath is what tells the 2 effects apart.
 */
export const SharkTokenHelp = (_props: MaterialHelpProps<number, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  return (
    <>
      <HelpTitle>{t('help.shark.title')}</HelpTitle>
      <Line label={t('help.placement')}>
        <HelpText code="help.shark.placement" />
      </Line>
      <Note code="help.note.pack" />
      <Note code="help.note.shark-victory" values={{ count: sharkTokens }} />
    </>
  )
}
