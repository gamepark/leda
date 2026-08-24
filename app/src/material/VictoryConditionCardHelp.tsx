import { css } from '@emotion/react'
import { Clan, clanStart } from '@gamepark/leda/Clan'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { awakeningGroup } from '@gamepark/leda/rules/awakening'
import { specialVictoryGoals, victorySymbolsToWin } from '@gamepark/leda/rules/victory'
import { MaterialHelpProps, ThemeButton } from '@gamepark/react-game'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClanCardsGrid } from './ClanCardsGrid'
import { HelpText, HelpTitle, Line, Note } from './helpLayout'

/**
 * The card a player keeps beside their grid, which is the whole of what their clan owes them: what their crystal
 * is worth, and the 2 races they run. Both numbers are read off the rules rather than written into the texts
 * (see {@link specialVictoryGoals}, {@link victorySymbolsToWin}), so a card cannot promise a game that is won on
 * a count the rules no longer use.
 *
 * The Special activation is the one thing on the card that is not a victory: it is the clan of the player, printed
 * where they can read it every time a crystal comes up on a tile or a card of theirs.
 *
 * Under all of it, the cards of the clan, which the card itself does not print and which are the other half of
 * what taking a clan means, a deck one has never played being unreadable from its 2 win conditions alone. They
 * are folded away behind a button rather than laid out straight away: what the card prints is what the dialog is
 * opened for, and the 11 to 13 cards of a clan are 3 rows that would push it out of sight
 * (see {@link ClanCardsGrid}).
 */
export const VictoryConditionCardHelp = ({ item }: MaterialHelpProps<number, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  const [cardsShown, setCardsShown] = useState(false)
  const cards = useRef<HTMLDivElement>(null)
  /**
   * The dialog grows with the grid rather than scrolling it into being, so the cards open under the fold of what
   * is already read and the button would look like it did nothing. Scrolled to on the opening alone, and never on
   * a plain render: the help is redrawn whenever the game moves on, and the reader is left where they were.
   * As short a scroll as it takes, which brings the whole grid up with the button still over it, and not a smooth
   * one: the dialog is drawn inside the transformed table, where Chrome drops a smooth scroll without a word.
   */
  useEffect(() => {
    if (cardsShown) cards.current?.scrollIntoView({ block: 'nearest' })
  }, [cardsShown])
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
      <ThemeButton css={showCardsButton} onClick={() => setCardsShown(!cardsShown)}>
        {t(cardsShown ? 'help.victory.hide-cards' : 'help.victory.show-cards')}
      </ThemeButton>
      {cardsShown && (
        <div ref={cards}>
          <ClanCardsGrid clan={clan} />
        </div>
      )}
    </>
  )
}

/**
 * Sized down from the text of the dialog, which is the size of a paragraph and would give the card a button read
 * before what it prints. Nothing else to set: a Dialog lays out every button it holds, and the note above leaves
 * the space this one sits in (see helpLayout.text).
 */
const showCardsButton = css`
  font-size: 0.85em;
`
