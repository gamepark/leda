import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { cardsToPutUnderDeck, underDeckMoves } from '@gamepark/leda/rules/underDeck'
import { LedaMenuButton } from './LedaMenuButton'
import { useMenuButtonRules } from './menuButtons'

/**
 * Where the button sits: clear of the 7 cm card, just above its top edge, so that it hides nothing of what is
 * printed on the card it belongs to. Towards the left, which is the strip of a card a hand leaves in sight: a hand
 * is a fan of cards each laid over the last, so anything drawn on the middle of one goes under the next.
 */
const handButtonPosition = { x: -2, y: -4.5 }

/**
 * The button a card of the player's own hand carries while they are being asked to give cards to their deck: the
 * price of a Cat card paid in cards, and a Ring traded for a Military Victory token. Dragging the card onto the
 * deck does the same thing (see {@link PlayerDeckDescription}), this only spares the drag.
 *
 * No label: a card crossed out says what pressing it does, and the header of the table already says what is being
 * paid and how much of it is left to pay.
 *
 * Which cards carry one, and the move each of them plays, come from the same helper the 2 rules build their own
 * moves with, so that a button can never offer what is not legal (see {@link cardsToPutUnderDeck}).
 */
export const PutUnderDeckButton = ({ index }: { index: number }) => {
  const context = useMenuButtonRules()
  if (context === undefined) return null
  const { rules, player: me } = context
  if (rules.getActivePlayer() !== me) return null

  const cards = cardsToPutUnderDeck(rules, me)
  if (cards === undefined || !cards.getIndexes().includes(index)) return null
  return (
    <LedaMenuButton {...handButtonPosition} move={underDeckMoves(cards.index(index), me)[0]}>
      <FontAwesomeIcon icon={faTrashCan} />
    </LedaMenuButton>
  )
}
