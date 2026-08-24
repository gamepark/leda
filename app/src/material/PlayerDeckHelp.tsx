import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { playerClan } from '@gamepark/leda/rules/specialActivation'
import { LocationHelpProps, useRules } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import { ClanCardsGrid } from './ClanCardsGrid'
import { HelpTitle, Paragraph } from './helpLayout'

/**
 * The deck of a player, which is what a click on one of its cards opens rather than the help of that card
 * (see ClanCardDescription.displayHelp): the cards of a pile are face down and shuffled, so there is nothing to
 * read on the one that happens to be on top. What is worth reading is the pile itself: how deep it still is, and
 * what the clan prints, which is fixed and is the whole of what may still come out of it.
 *
 * The grid underneath is the whole clan and not the cards left in the deck: which of them are still in there is
 * nobody's to know, their owner included (see {@link ClanCardsGrid}).
 */
export const PlayerDeckHelp = ({ location }: LocationHelpProps<number, LocationType>) => {
  const { t } = useTranslation()
  const rules = useRules<LedaRules>()
  const player = location.player
  if (rules === undefined || player === undefined) return null
  const clan = playerClan(rules, player)
  const count = rules.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(player).length
  return (
    <>
      <HelpTitle>{clan === undefined ? t('help.deck.title') : t('help.deck.clan-title', { clan: t(`clan.${clan}`) })}</HelpTitle>
      <Paragraph>{t('help.deck.count', { count })}</Paragraph>
      {clan !== undefined && (
        <>
          <Paragraph>{t('help.deck.all')}</Paragraph>
          <ClanCardsGrid clan={clan} />
        </>
      )}
    </>
  )
}
