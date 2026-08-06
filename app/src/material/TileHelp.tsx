import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { isPermanent } from '@gamepark/leda/material/TileEffect'
import { TileId } from '@gamepark/leda/material/TileId'
import { MaterialHelpProps } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { HelpText, HelpTitle, Line, Note } from './helpLayout'

/**
 * The code a tile is written under in the translation files, which is the name of its image file, exactly as the
 * cards are written down (see {@link clanCardCodes}). The upgraded face of a permanent tile is the same key
 * suffixed `-2`; the Desert face of a temporary one is shared by all of them, so it has a key of its own.
 *
 * Total rather than partial: a tile added to {@link TileId} without a text of its own does not compile.
 */
const tileCodes: Record<TileId, string> = {
  [TileId.PermanentDraw]: 'permanent-draw',
  [TileId.PermanentSpecialActivation]: 'permanent-special-activation',
  [TileId.PermanentFood]: 'permanent-food',
  [TileId.PermanentMilitary]: 'permanent-military',
  [TileId.TemporaryFood]: 'temporary-food',
  [TileId.TemporaryDraw]: 'temporary-draw',
  [TileId.TemporaryUpgrade]: 'temporary-upgrade',
  [TileId.TemporarySpecialActivation]: 'temporary-special-activation',
  [TileId.TemporaryMilitary]: 'temporary-military'
}

/**
 * What one of the 16 tiles of a grid gives, face by face, the way the rulebook writes it: what activating its
 * front does, what its back does, and a reminder of which of the 2 kinds of tile this one is.
 *
 * Both faces are told whichever one is showing: a player reading a Desert is usually asking what it takes to get
 * it back, and one reading a tile they are about to upgrade is asking what the upgrade is worth.
 * Which kind the tile is comes from the rules, so the dialog cannot call permanent a tile the game turns over.
 */
export const TileHelp = ({ item }: MaterialHelpProps<number, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  const tile = item.id as TileId | undefined
  /** Nothing hides a tile: the grids are open, and a tile with no id is one no dialog was opened about. */
  if (tile === undefined) return null
  const code = tileCodes[tile]
  const permanent = isPermanent(tile)
  return (
    <>
      <HelpTitle>{t(permanent ? 'help.tile.permanent' : 'help.tile.temporary')}</HelpTitle>
      <Line label={t('help.front')}>
        <HelpText code={`help.tile.${code}`} />
      </Line>
      <Line label={t(permanent ? 'help.back' : 'help.desert')}>
        <HelpText code={permanent ? `help.tile.${code}-2` : 'help.tile.desert-face'} />
      </Line>
      <Note code={permanent ? 'help.note.permanent' : 'help.note.temporary'} />
    </>
  )
}
