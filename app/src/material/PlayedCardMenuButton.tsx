import { faEgg, faEye, faRotate, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { activableCards } from '@gamepark/leda/rules/playedCards'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { isSpiedEgg } from '@gamepark/leda/rules/snake'
import { isMoveItemType, MaterialMove, MaterialMoveBuilder, XYCoordinates } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { ActivateSquareButton } from './ActivateSquareButton'
import { ChooseZoneButton } from './ChooseActionTileButton'
import { LedaMenuButton } from './LedaMenuButton'
import { offeredCells, useMenuButtonRules } from './menuButtons'
import { tileButtonPosition } from './tileButtonPosition'

/**
 * The button a card played on a grid carries. A card covers the tile of its square, button included, so the
 * activation of a square is offered here as well as on a bare tile (see {@link ActivateSquareButton}), and this is
 * also where a card is picked when another card asks for one (see {@link ActivateCardRule}).
 *
 * Read off the state nothing is still catching up with, like every other button of the table
 * (see {@link useMenuButtonRules}).
 */
export const PlayedCardMenuButton = ({ index }: { index: number }) => {
  const context = useMenuButtonRules()
  if (context === undefined) return null
  const { rules, player: me } = context
  if (rules.getActivePlayer() !== me) return null

  switch (rules.game.rule?.id) {
    case RuleId.ChooseAction:
      return <ChooseZoneCardButton index={index} rules={rules} player={me} />
    case RuleId.ActivateZone:
      return <ActivateCardSquareButton index={index} rules={rules} player={me} />
    case RuleId.ActivateCard:
      return <ActivateCardButton index={index} rules={rules} player={me} />
    case RuleId.CopyOpponentCard:
      return <CopyOpponentCardButton index={index} rules={rules} player={me} />
    case RuleId.RotateCatCard:
      return <RotateCatCardButton index={index} rules={rules} player={me} />
    case RuleId.CopySnake:
      return <CopySnakeButton index={index} rules={rules} player={me} />
    case RuleId.FlipSnakeToEgg:
      return <FlipSnakeToEggButton index={index} rules={rules} player={me} />
    case RuleId.Spy:
      return <SpyEggButton index={index} rules={rules} player={me} />
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

/**
 * The button that picks a zone, when the square carrying it is covered by a card of its owner
 * (see {@link ChooseZoneButton}). Their own grid alone: the buttons are on the grid of the player picking.
 */
const ChooseZoneCardButton = ({ index, rules, player }: CardButtonProps) => {
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  const cell = cardCell(rules, index)
  if (card.location.player !== player || cell === undefined) return null
  return <ChooseZoneButton rules={rules} cell={cell} />
}

/** The square of the card, when its owner still has it to activate: what a card gives is what its square gives. */
const ActivateCardSquareButton = ({ index, rules, player }: CardButtonProps) => {
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  const cell = cardCell(rules, index)
  if (card.location.player !== player || cell === undefined) return null
  if (!activatable(rules, player, cell)) return null
  return <ActivateSquareButton cell={cell} />
}

/**
 * The card itself, when the player is being asked which of their cards in play they activate. A move names the
 * square and not the card, and a square may hold a pile of them, so which card of the pile it means is asked of
 * the rules: the one no other covers (see {@link activableCards}).
 */
const ActivateCardButton = ({ index, rules, player }: CardButtonProps) => {
  const cell = cardCell(rules, index)
  if (cell === undefined || !activableCards(rules, player).getIndexes().includes(index)) return null
  if (!activatable(rules, player, cell)) return null
  return <ActivateSquareButton cell={cell} />
}

/**
 * A card of the opponent, when a Cat card is copying a square of theirs: the button sits on their grid, which is
 * where what is being copied is, and the square it names is a square of their grid.
 * Their bare squares carry the same one, on the tile itself (see {@link TileMenuButton}).
 */
const CopyOpponentCardButton = ({ index, rules, player }: CardButtonProps) => {
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  const opponent = rules.game.players.find((other) => other !== player)
  const cell = cardCell(rules, index)
  if (card.location.player !== opponent || cell === undefined) return null
  if (!activatable(rules, player, cell)) return null
  return <ActivateSquareButton cell={cell} />
}

/** Whether the square a card stands on is one of those the rules are offering to activate right now. */
const activatable = (rules: LedaRules, player: number, cell: XYCoordinates): boolean =>
  offeredCells(rules, player, CustomMoveType.ActivateSquare).some((activable) => sameCell(activable, cell))

/**
 * A Cat card of the player, when a Ring offers to turn one of them over. The Rings themselves carry none: they
 * print one effect and no second one (see {@link RotateCatCardRule}).
 */
const RotateCatCardButton = ({ index, rules, player }: CardButtonProps) => {
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  const cell = cardCell(rules, index)
  if (card.location.player !== player || cell === undefined) return null
  if (!offeredCells(rules, player, CustomMoveType.RotateCatCard).some((rotatable) => sameCell(rotatable, cell))) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={MaterialMoveBuilder.customMove(CustomMoveType.RotateCatCard, cell)}>
      <FontAwesomeIcon icon={faRotate} />
    </LedaMenuButton>
  )
}

/**
 * A Snake of the player, when one of their cards is copying one of them. The card doing the copying carries none:
 * reading itself would ask the same question over again (see {@link copiableSnakes}).
 */
const CopySnakeButton = ({ index, rules, player }: CardButtonProps) => {
  const card = rules.material(MaterialType.ClanCard).getItem(index)
  const cell = cardCell(rules, index)
  if (card.location.player !== player || cell === undefined) return null
  if (!offeredCells(rules, player, CustomMoveType.ActivateSquare).some((copiable) => sameCell(copiable, cell))) return null
  return <ActivateSquareButton cell={cell} />
}

/**
 * A Snake of the player, when one of their cards is turning one of them back onto its Egg side, which is what the
 * 2 strongest cards of the clan are paid with (see {@link FlipSnakeToEggRule}).
 * The move is read off the rules rather than built here, so a button can never turn a card the rules would not.
 */
const FlipSnakeToEggButton = ({ index, rules, player }: CardButtonProps) => {
  const move = cardMove(rules, player, index)
  if (move === undefined) return null
  return (
    <LedaMenuButton {...tileButtonPosition} move={move}>
      <FontAwesomeIcon icon={faEgg} />
    </LedaMenuButton>
  )
}

/**
 * An Egg of the opponent, when a Spy effect may be spent reading one: the one way across the bluff of the Snakes,
 * and the one Spy of the game that is aimed at a grid rather than at a pile (see {@link spiableEggs}).
 * On their grid, which is where the Egg is, exactly as the button that copies one of their squares is.
 * The same card carries the button that turns it back once it has been read, which is the one move left then.
 * Both in the top right corner, the one turning into the other right where the player clicked.
 */
const SpyEggButton = ({ index, rules, player }: CardButtonProps) => {
  const { t } = useTranslation()
  const move = cardMove(rules, player, index)
  if (move === undefined) return null
  if (isSpiedEgg(rules.material(MaterialType.ClanCard).getItem(index))) {
    return (
      <LedaMenuButton x={-tileButtonPosition.x} y={tileButtonPosition.y} labelPosition="right" move={move} label={t('spy.put-back')}>
        <FontAwesomeIcon icon={faRotateLeft} />
      </LedaMenuButton>
    )
  }
  return (
    <LedaMenuButton x={-tileButtonPosition.x} y={tileButtonPosition.y} move={move}>
      <FontAwesomeIcon icon={faEye} />
    </LedaMenuButton>
  )
}

/**
 * The move the rules are offering on that very card, if there is one: read off the legal moves rather than built
 * beside them, so that there is one button exactly where there is one move (see {@link offeredCells}).
 */
const cardMove = (rules: LedaRules, player: number, index: number): MaterialMove<number, MaterialType, LocationType> | undefined =>
  rules.getLegalMoves(player).find((move) => isMoveItemType(MaterialType.ClanCard)(move) && move.itemIndex === index)
