import { Clan } from '@gamepark/leda/Clan'
import { MaterialLogProps, usePlayerName } from '@gamepark/react-game'
import { CustomMove } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { LogText } from '../LogText'

/** Setup step 6, which is the only part of the setup a player is asked anything in (see {@link ChooseClanRule}). */

/** A player picks the clan they will play, and takes all of its material. */
export const ChooseClanLog = ({ move, context }: MaterialLogProps<CustomMove>) => {
  const { t } = useTranslation()
  const player = usePlayerName(context.game.rule?.player)
  return <LogText code="log.choose-clan" values={{ player, clan: t(`clan.${move.data as Clan}`) }} />
}

/**
 * A player was not happy with the cards they drew and puts them back to draw as many again. The cards themselves
 * are not logged: they are drawn by consequences of this very move, and a hand is nobody else's to read anyway.
 */
export const MulliganLog = ({ move }: MaterialLogProps<CustomMove>) => {
  const player = usePlayerName(move.data as number)
  return <LogText code="log.mulligan" values={{ player }} />
}
