import { faCheck, faShuffle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { css } from '@emotion/react'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { isCustomMoveType } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { handX, handY, tableXMax, tableYMin } from './locators/Locators'
import { LedaMenuButton } from './material/LedaMenuButton'
import { useMenuButtonRules } from './material/menuButtons'

/**
 * How far to each side of the middle of the fan the 2 buttons sit, and how high above it: the same height as the
 * button a card of the hand carries elsewhere, which is clear of the 7 cm cards
 * (see {@link PutUnderDeckButton}).
 */
const buttonX = 1.6
const buttonY = -4.5

/**
 * The choice that ends the setup, asked where the player is already looking: over the hand they have just drawn,
 * rather than in the header alone at the other end of the screen. The header still asks the question, and its own
 * 2 buttons still answer it (see {@link MulliganHeader}).
 *
 * Both players decide at the same time, so a player only ever sees their own pair: the hand a mulligan is offered
 * on is always the one at the bottom left of the screen, which is where the framework puts the player looking.
 * Read through the hooks like every other button of the table, and off the moves the rules hand the player, so
 * that a button can never offer what is not legal (see {@link useMenuButtonRules}).
 */
export const MulliganButtons = () => {
  const context = useMenuButtonRules()
  const { t } = useTranslation()

  if (context === undefined) return null
  const { rules, player: me } = context
  if (rules.game.rule?.id !== RuleId.Mulligan || !rules.isTurnToPlay(me)) return null

  const moves = rules.getLegalMoves(me)
  const keep = moves.find(isCustomMoveType<CustomMoveType, number>(CustomMoveType.Pass))
  const redraw = moves.find(isCustomMoveType<CustomMoveType, number>(CustomMoveType.Mulligan))
  if (keep === undefined || redraw === undefined) return null

  return (
    <div css={anchor}>
      <LedaMenuButton move={keep} x={-buttonX} y={buttonY} label={t('mulligan.keep')} labelPosition="left">
        <FontAwesomeIcon icon={faCheck} />
      </LedaMenuButton>
      <LedaMenuButton move={redraw} x={buttonX} y={buttonY} label={t('mulligan.redraw')} labelPosition="right">
        <FontAwesomeIcon icon={faShuffle} />
      </LedaMenuButton>
    </div>
  )
}

/**
 * The middle of the player's own fan, reached from the corner the coordinates of the table are counted from, the
 * way anything that is no material of the game finds its place (see {@link RoundPhaseButton}).
 * Lifted the way the framework lifts the menu of an item, so that the buttons stand above the cards they belong
 * to rather than between them: a hand is laid at z = 5, and its cards are fanned one over the last.
 */
const anchor = css`
  position: absolute;
  left: ${tableXMax}em;
  top: ${-tableYMin}em;
  transform-style: preserve-3d;
  transform: translate(${-handX}em, ${handY}em) translateZ(15em);

  > * {
    position: absolute;
  }
`
