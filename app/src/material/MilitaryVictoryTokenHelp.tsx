import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { militaryVictoryEffects, militaryVictorySymbols, MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { playerClan } from '@gamepark/leda/rules/specialActivation'
import { victorySymbolsToWin } from '@gamepark/leda/rules/victory'
import { MaterialHelpProps, useRules } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { HelpText, HelpTitle, Line, Note, Paragraph } from './helpLayout'

/**
 * The code a token is written under in the translation files, which is the name of its image file, exactly as the
 * cards and the tiles are written down (see {@link clanCardCodes}, {@link tileCodes}).
 * The 2 tokens that are worth their symbols and nothing else have no text: what they give is said by the rules
 * (see {@link militaryVictoryEffects}), and a token with nothing to add says so.
 *
 * Total rather than partial: a token added to {@link MilitaryVictoryTokenId} without a text does not compile.
 */
const tokenCodes: Record<MilitaryVictoryTokenId, string> = {
  [MilitaryVictoryTokenId.Victory]: 'victory',
  [MilitaryVictoryTokenId.DoubleVictory]: 'double-victory',
  [MilitaryVictoryTokenId.Spy]: 'spy',
  [MilitaryVictoryTokenId.FlipDesert]: 'flip-desert',
  [MilitaryVictoryTokenId.Upgrade]: 'upgrade',
  [MilitaryVictoryTokenId.Food]: 'food',
  [MilitaryVictoryTokenId.StealFood]: 'steal-food',
  [MilitaryVictoryTokenId.Draw]: 'draw'
}

/**
 * What a Military Victory token is worth: the Victory symbols printed on it, and what resolving it gives on top
 * of them. How many symbols and whether there is anything else are read off the rules, so a token cannot end up
 * being announced as worth something the game does not give.
 *
 * The reminders are told whichever token this is, and the pile itself is one of them: it is clicked face down,
 * where there is no token to read, and what a player is asking then is how one is won at all.
 */
export const MilitaryVictoryTokenHelp = ({ item }: MaterialHelpProps<number, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  const token = item.id as MilitaryVictoryTokenId | undefined
  return (
    <>
      <HelpTitle>{t('help.token.title')}</HelpTitle>
      {token === undefined ? (
        /** The pile is shuffled face down between the players: there is nothing to read on the token on top of it. */
        <Paragraph>{t('help.token.hidden')}</Paragraph>
      ) : (
        <>
          <Line label={t('help.symbols')}>
            <HelpText code="help.token.symbols" values={{ count: militaryVictorySymbols(token) }} />
          </Line>
          <Line label={t('help.effect')}>
            {militaryVictoryEffects[token] === undefined ? t('help.none') : <HelpText code={`help.token.${tokenCodes[token]}`} />}
          </Line>
        </>
      )}
      <Note code="help.note.conflict" />
      <ClanGoals />
    </>
  )
}

/**
 * What the symbols are gathered towards, said for the 2 clans of this game and not for the 4 of the box: the
 * number to reach is printed on the Victory condition card of a clan, so it is not the same race for the 2
 * players, and reading one number without the other says nothing about who is ahead (see {@link victorySymbolsToWin}).
 *
 * A clan that has not been taken yet is left out rather than guessed at, which is only true of the setup.
 *
 * Read from the pile of tokens as well, where the question is the same one and the token is unknown
 * (see {@link MilitaryVictoryDeckHelp}).
 */
export const ClanGoals = () => {
  const { t } = useTranslation()
  const rules = useRules<LedaRules>()
  if (rules === undefined) return null
  return (
    <>
      {rules.game.players.map((player) => {
        const clan = playerClan(rules, player)
        if (clan === undefined) return null
        return <Note key={player} code="help.note.clan-victory" values={{ clan: t(`clan.${clan}`), count: victorySymbolsToWin[clan] }} />
      })}
    </>
  )
}
