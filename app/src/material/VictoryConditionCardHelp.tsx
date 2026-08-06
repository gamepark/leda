import { Clan, clanStart } from '@gamepark/leda/Clan'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { awakeningGroup } from '@gamepark/leda/rules/awakening'
import { specialVictoryGoals, victorySymbolsToWin } from '@gamepark/leda/rules/victory'
import { MaterialHelpProps } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { HelpText, HelpTitle, Line, Note } from './helpLayout'

/**
 * The card a player keeps beside their grid, which is the whole of what their clan owes them: what their crystal
 * is worth, and the 2 races they run. Both numbers are read off the rules rather than written into the texts
 * (see {@link specialVictoryGoals}, {@link victorySymbolsToWin}), so a card cannot promise a game that is won on
 * a count the rules no longer use.
 *
 * The Special activation is the one thing on the card that is not a victory: it is the clan of the player, printed
 * where they can read it every time a crystal comes up on a tile or a card of theirs.
 */
export const VictoryConditionCardHelp = ({ item }: MaterialHelpProps<number, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  const clan = item.id as Clan | undefined
  /** The card is never face down: it marks the clan a player took, and is put out the moment they take one. */
  if (clan === undefined) return null
  return (
    <>
      <HelpTitle>{t('help.victory.title')}</HelpTitle>
      {/* The corner of the card, read first because it is read once: what the clan is given when it is picked. */}
      <Line label={t('help.start')}>
        <HelpText code="help.victory.start" values={{ cards: clanStart[clan].cards, food: clanStart[clan].food }} />
      </Line>
      <Line label={t('help.special-activation')}>
        <HelpText code={`help.victory.activation.${clan}`} />
      </Line>
      <Line label={t('help.clan-victory')}>
        <HelpText code={`help.victory.clan.${clan}`} values={{ count: specialVictoryGoals[clan] }} />
      </Line>
      <Line label={t('help.military-victory')}>
        <HelpText code="help.token.symbols" values={{ count: victorySymbolsToWin[clan] }} />
      </Line>
      <Note code="help.note.special-activation" />
      {/* The Pandas are the only clan whose crystal opens onto a keyword of its own, and whose win condition is one. */}
      {clan === Clan.Panda && <Note code="help.note.awakening" values={{ count: awakeningGroup }} />}
    </>
  )
}
