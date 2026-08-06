import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { roundsPerCycle } from '@gamepark/leda/rules/EndOfRoundRule'
import { MaterialHelpProps } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { HelpText, HelpTitle, Line, Note, Paragraph } from './helpLayout'

/**
 * The code an Action tile is written under in the translation files, which is the name of its image file, exactly
 * as the rest of the material is written down (see {@link clanCardCodes}, {@link tileCodes}, {@link tokenCodes}).
 * What each of them offers is drawn on the tile itself: the text says it in words (see {@link actionTileZones}).
 *
 * Total rather than partial: a tile added to {@link ActionTileId} without a text of its own does not compile.
 */
const actionTileCodes: Record<ActionTileId, string> = {
  [ActionTileId.TopLeft]: 'top-left',
  [ActionTileId.TopRight]: 'top-right',
  [ActionTileId.BottomLeft]: 'bottom-left',
  [ActionTileId.BottomRight]: 'bottom-right',
  [ActionTileId.CornersOrCenter]: 'corners-or-center'
}

/**
 * The zones an Action tile offers, and what the round does with them. The 2 reminders are told whichever tile this
 * is, the face down pile included: it is clicked before anything has been revealed, and what a player is asking
 * then is what these tiles are for.
 */
export const ActionTileHelp = ({ item }: MaterialHelpProps<number, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  const tile = item.id as ActionTileId | undefined
  return (
    <>
      <HelpTitle>{t('help.action.title')}</HelpTitle>
      {tile === undefined ? (
        /** The pile is shuffled face down between the players: nothing says which tile comes next. */
        <Paragraph>{t('help.action.hidden')}</Paragraph>
      ) : (
        <Line label={t('help.zones')}>
          <HelpText code={`help.action.${actionTileCodes[tile]}`} />
        </Line>
      )}
      <Note code="help.note.action" />
      <Note code="help.note.cycle" values={{ count: roundsPerCycle }} />
    </>
  )
}
