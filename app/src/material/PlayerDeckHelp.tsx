import { css } from '@emotion/react'
import { clanCards } from '@gamepark/leda/Clan'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { playerClan } from '@gamepark/leda/rules/specialActivation'
import { LocationHelpProps, MaterialComponent, pointerCursorCss, usePlay, useRules } from '@gamepark/react-game'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { HelpTitle, Paragraph } from './helpLayout'
import { tileSize } from './TileDescription'

/**
 * The deck of a player, which is what a click on one of its cards opens rather than the help of that card
 * (see ClanCardDescription.displayHelp): the cards of a pile are face down and shuffled, so there is nothing to
 * read on the one that happens to be on top. What is worth reading is the pile itself: how deep it still is, and
 * what the clan prints, which is fixed and is the whole of what may still come out of it.
 *
 * The grid is the 11 to 13 cards of the clan, in punchboard order, and not the cards left in the deck: which of
 * them are still in there is nobody's to know, their owner included. Each of them opens its own help, laid over
 * this one, so that the deck reads as the table of contents of the clan.
 *
 * A card of the grid is opened by its id alone and not as an item of the deck, which it may well not be one of any
 * more: an id is the whole of what its help reads, while an item of a location would have the dialog offer to page
 * through the cards of the pile, which are face down and have nothing to show.
 */
export const PlayerDeckHelp = ({ location }: LocationHelpProps<number, LocationType>) => {
  const { t } = useTranslation()
  const rules = useRules<LedaRules>()
  const play = usePlay()
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
          <ol css={grid(clanCards(clan).length)}>
            {clanCards(clan).map((card) => {
              const id = { front: card, back: clan }
              return (
                <li key={card}>
                  <MaterialComponent
                    type={MaterialType.ClanCard}
                    itemId={id}
                    css={pointerCursorCss}
                    onClick={() =>
                      play(MaterialMoveBuilder.displayMaterialHelp<number, MaterialType, LocationType>(MaterialType.ClanCard, { id }), {
                        local: true
                      })
                    }
                  />
                </li>
              )
            })}
          </ol>
        </>
      )}
    </>
  )
}

/** The gap between 2 cards of the grid, in the em of the grid itself, which its width is counted in as well. */
const gridGap = 0.6

/**
 * As wide as it takes for the clan to be read in 3 rows, which is 4 cards a row for the 11 of most clans and 5 for
 * the 13 of the Cats: 3 rows is what the dialog holds without scrolling, and the rows come out even rather than
 * leaving one card alone underneath. The cards are square and as wide as a tile, so a row is that many of those
 * plus the gaps between them, and the list wraps on its own rather than shrinking them if the dialog ever opens
 * narrower than that.
 * The padding at the top and the bottom is the room the lift on hover takes: the dialog scrolls its content, and
 * without it the raised card would be clipped.
 */
const grid = (cards: number) => {
  const columns = Math.ceil(cards / 3)
  return css`
    display: flex;
    flex-wrap: wrap;
    list-style-type: none;
    gap: ${gridGap}em;
    padding: 0.3em 0 0.5em;
    margin: 0.5em 0 0;
    font-size: 1.2em;
    max-width: calc(${columns} * ${tileSize}em + ${columns - 1} * ${gridGap}em);

    li {
      display: flex;
      transition: transform 0.18s cubic-bezier(0.3, 1.4, 0.4, 1);
    }

    li:hover {
      transform: translateY(-0.25em);
      z-index: 1;
    }
  `
}
