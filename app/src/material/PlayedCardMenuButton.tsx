import { faRotate } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { activableCells, copiableCells, rotatableCells } from '@gamepark/leda/rules/activation'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { activableCards } from '@gamepark/leda/rules/playedCards'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { usePlayerId, useRules } from '@gamepark/react-game'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { ActivateSquareButton } from './ActivateSquareButton'
import { LedaMenuButton } from './LedaMenuButton'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The button a card played on a grid carries. A card covers the tile of its square, button included, so the
 * activation of a square is offered here as well as on a bare tile (see {@link ActivateSquareButton}), and this is
 * also where a card is picked when another card asks for one (see {@link ActivateCardRule}).
 *
 * Read through the hooks rather than through the context handed to the material description: a card is only
 * re-rendered when its own item changes, which is far from every time its button has to change.
 */
export const PlayedCardMenuButton = ({ index }: { index: number }) => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  // Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
  if (!rules || me === undefined || rules.getActivePlayer() !== me) return null

  switch (rules.game.rule?.id) {
    case RuleId.ActivateZone:
      return <ActivateCardSquareButton index={index} rules={rules} player={me} />
    case RuleId.ActivateCard:
      return <ActivateCardButton index={index} rules={rules} player={me} />
    case RuleId.CopyOpponentCard:
      return <CopyOpponentCardButton index={index} rules={rules} player={me} />
    case RuleId.RotateCatCard:
      return <RotateCatCardButton index={index} rules={rules} player={me} />
    default:
      return null
  }
}

type CardButtonProps = { index: number; rules: LedaRules; player: number }

/** The square a card stands on, which is the square its own button activates. */
const cardCell = (rules: LedaRules, index: number) => {
  const { parent } = rules.material(MaterialType.ClanCard).getItem(index).location
  return parent === undefined ? undefined : cellOf(rules.material(MaterialType.Tile).getItem(parent).location)
}

/** The square of the card, when its owner still has it to activate: what a card gives is what its square gives. */
const ActivateCardSquareButton = ({ index, rules, player }: CardButtonProps) => {
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  const cell = cardCell(rules, index)
  if (card.location.player !== player || cell === undefined) return null
  if (!activableCells(rules, player).some((activable) => sameCell(activable, cell))) return null
  return <ActivateSquareButton cell={cell} />
}

/** The card itself, when the player is being asked which of their cards in play they activate. */
const ActivateCardButton = ({ index, rules, player }: CardButtonProps) => {
  const cell = cardCell(rules, index)
  if (!activableCards(rules, player).getIndexes().includes(index) || cell === undefined) return null
  return <ActivateSquareButton cell={cell} />
}

/**
 * A card of the opponent, when a Cat card is copying one of theirs: the button sits on their grid, which is where
 * the card being copied is, and the square it names is a square of their grid (see {@link CopyOpponentCardRule}).
 */
const CopyOpponentCardButton = ({ index, rules, player }: CardButtonProps) => {
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  const opponent = rules.game.players.find((other) => other !== player)
  const cell = cardCell(rules, index)
  if (card.location.player !== opponent || cell === undefined) return null
  if (!copiableCells(rules, player).some((copiable) => sameCell(copiable, cell))) return null
  return <ActivateSquareButton cell={cell} />
}

/**
 * A Cat card of the player, when a Ring offers to turn one of them over. The Rings themselves carry none: they
 * print one effect and no second one (see {@link RotateCatCardRule}).
 */
const RotateCatCardButton = ({ index, rules, player }: CardButtonProps) => {
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  const cell = cardCell(rules, index)
  if (card.location.player !== player || cell === undefined) return null
  if (!rotatableCells(rules, player).some((rotatable) => sameCell(rotatable, cell))) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={MaterialMoveBuilder.customMove(CustomMoveType.RotateCatCard, cell)}>
      <FontAwesomeIcon icon={faRotate} />
    </LedaMenuButton>
  )
}
