import { css } from '@emotion/react'
import { ClanCardId } from '@gamepark/leda/material/ClanCardId'
import { Ring } from '@gamepark/leda/material/clanCards/catCards'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { ringCatCardsInZone, ringConflictLead, ringUpgradedTiles } from '@gamepark/leda/rules/rings'
import { Dialog, PlayMoveButton, useLegalMoves } from '@gamepark/react-game'
import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { clanCardFronts } from '../material/ClanCardDescription'
import { copper } from '../theme'

type SearchRingDialogProps = {
  open: boolean
  close: () => void
}

/**
 * What each Ring asks for before it may be put in play, which is the whole of what tells them apart: the effect is
 * the same on all 4 (see {@link ringPlacements}). The numbers are read off the rules rather than written into the
 * texts, so that a balance change cannot leave the dialog lying about what the card asks.
 */
const ringConditions: Record<Ring, { code: string; count?: number }> = {
  [ClanCardId.CatRingWinConflictByThree]: { code: 'win-conflict', count: ringConflictLead },
  [ClanCardId.CatRingEmptyDeck]: { code: 'empty-deck' },
  [ClanCardId.CatRingThreeCatCards]: { code: 'three-cat-cards', count: ringCatCardsInZone },
  [ClanCardId.CatRingFiveUpgradedTiles]: { code: 'five-upgraded-tiles', count: ringUpgradedTiles }
}

/**
 * A Cat card searching the deck of its owner for a Ring. The Rings still in there are not on the table, and their
 * place in the pile is nobody's to know, so this is where they are picked: face up, with what each of them asks
 * for spelled out, and a button of its own underneath.
 *
 * Which Rings those are comes from the legal moves, and the rules work them out rather than read the deck, which
 * is shuffled and hidden from its owner too: a Ring that is neither in hand nor in play is a Ring still in the
 * pile (see {@link ringsInDeck}). The move names the Ring, and the server alone finds where it is.
 */
export const SearchRingDialog = ({ open, close }: SearchRingDialogProps) => {
  const { t } = useTranslation()
  const moves = useLegalMoves<CustomMove<CustomMoveType, ClanCardId>>(isCustomMoveType(CustomMoveType.SearchRing))
  return (
    <Dialog open={open} onBackdropClick={close}>
      <div css={content}>
        <h2 css={title}>{t('search-ring.choose')}</h2>
        {/* The 4 Rings share one effect, so it is said once here rather than repeated under each of them. */}
        <p css={sharedEffect}>
          <span css={label}>{t('search-ring.effect')}</span> {t('search-ring.rotate')}
        </p>
        <div css={ringList}>
          {moves.map((move) => {
            const { code, count } = ringConditions[move.data as Ring]
            return (
              <div key={move.data} css={ringCard}>
                <img src={clanCardFronts[move.data!]} alt="" css={ringImage} />
                <p css={ringText}>
                  <span css={label}>{t('search-ring.condition')}</span> {t(`search-ring.${code}`, { count })}
                </p>
                <PlayMoveButton move={move} onPlay={close} css={pickButton}>
                  {t('search-ring.pick')}
                </PlayMoveButton>
              </div>
            )
          })}
        </div>
      </div>
    </Dialog>
  )
}

/** Colors come from the theme: the Dialog of the framework already applies its background and its text color. */
const content = css`
  padding: 2em 3em;
`

const title = css`
  margin: 0 0 0.4em;
  text-align: center;
  font-size: 2.6em;
`

const sharedEffect = css`
  margin: 0 0 1.2em;
  text-align: center;
  font-size: 2em;
`

/**
 * Up to 4 Rings, which is what the row is sized for: 19em a column leaves the table just as much room around the
 * dialog as the widest of the grids has. They wrap rather than shrink if a clan ever prints more.
 */
const ringList = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: 1.5em;
  max-width: 82em;
`

/** A column per Ring: the card, what it asks for, and the button that takes it. */
const ringCard = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8em;
  width: 19em;
`

const ringImage = css`
  display: block;
  width: 19em;
  border-radius: 0.4em;
  border: 0.1em solid ${copper};
  box-shadow: 0 0.15em 0.4em rgba(0, 0, 0, 0.45);
`

const ringText = css`
  margin: 0;
  font-size: 2em;
  line-height: 1.25;
  text-align: center;
`

/** "Effet" and "Condition de pose", the two headings the rulebook prints on the cards themselves. */
const label = css`
  font-weight: 700;
  color: ${copper};
`

/**
 * Pushed to the bottom of its column, which the stretched row makes as tall as the longest of the 4: the buttons
 * then line up whatever the length of the texts above them.
 */
const pickButton = css`
  margin-top: auto;
  padding: 0.3em 1.4em;
  font-size: 2.2em;
`
