import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { activableCells } from '@gamepark/leda/rules/activation'
import { activableCards } from '@gamepark/leda/rules/playedCards'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { usePlayerId, useRules } from '@gamepark/react-game'
import { ActivateSquareButton } from './ActivateSquareButton'

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
