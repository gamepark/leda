import { css } from '@emotion/react'
import { ClanCardId } from '@gamepark/leda/material/ClanCardId'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
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
 * A Cat card searching the deck of its owner for a Ring. The Rings still in there are not on the table, and their
 * place in the pile is nobody's to know, so this is where they are picked: face up, one button each.
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
        <div css={ringList}>
          {moves.map((move) => (
            <PlayMoveButton key={move.data} move={move} onPlay={close} css={ringButton}>
              <img src={clanCardFronts[move.data!]} alt="" css={ringImage} />
            </PlayMoveButton>
          ))}
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
  margin: 0 0 1em;
  text-align: center;
  font-size: 2.5em;
`

/** Up to 4 Rings, which is what the row is sized for: they wrap rather than shrink if a clan ever prints more. */
const ringList = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2em;
  max-width: 46em;
`

const ringButton = css`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: transform 0.1s ease-in-out;

  &:hover,
  &:focus {
    transform: scale(1.05);
  }
`

const ringImage = css`
  display: block;
  width: 10em;
  border-radius: 0.4em;
  border: 0.1em solid ${copper};
  box-shadow: 0 0.15em 0.4em rgba(0, 0, 0, 0.45);
`
