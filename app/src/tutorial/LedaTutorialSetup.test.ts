import { Clan } from '@gamepark/leda/Clan'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { ActionZone, actionZoneCells, revealedActionTile } from '@gamepark/leda/material/ActionZone'
import { ClanCardId, ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { clanCardFoodCost } from '@gamepark/leda/material/clanCards/cardProperties'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { cellOf, gridCells, sameCell, tileAt } from '@gamepark/leda/material/PlayerGrid'
import { TileId } from '@gamepark/leda/material/TileId'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { militarySymbols, victorySymbols } from '@gamepark/leda/rules/militaryConflict'
import { playerFood } from '@gamepark/leda/rules/organisation'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { playerClan } from '@gamepark/leda/rules/specialActivation'
import { isCustomMoveType, isMoveItemType, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { firstRoundZone, LedaTutorialSetup, scriptedCells, secondRoundZone, tutorialOpponent, tutorialPlayer } from './LedaTutorialSetup'
import { aiMove } from './TutorialAI'

/**
 * The table the tutorial opens on, and the round it walks the reader through.
 *
 * The texts of the tutorial make claims about the game they are read on - the reader wins the first conflict 1 to
 * 0, and organises their grid with 5 Food - and those claims are what is checked here: the scenario is scripted in
 * the setup, but what it is worth is only known once the round is played out.
 * The steps themselves live with their popups (see {@link LedaTutorial}), which the browser is the only place to
 * read; the squares they name are the ones this replays (see {@link scriptedCells}).
 */

type Move = MaterialMove<number, MaterialType, LocationType>

const setup = new LedaTutorialSetup()

const newGame = () => new LedaRules(setup.setup({ players: 2 }, { step: 0, stepComplete: false, popupClosed: false }))

/** A move and everything it owes, played straight into the state, which is what a server does with it. */
const playAll = (rules: LedaRules, move: Move) => {
  const randomized = JSON.parse(JSON.stringify(rules.randomize(move)))
  for (const consequence of rules.play(randomized)) playAll(rules, consequence)
}

/** The one legal move of a player that matches what the tutorial asks of them at that moment. */
const play = (rules: LedaRules, player: number, filter: (move: Move) => boolean) => {
  const moves = rules.getLegalMoves(player).filter(filter)
  expect(moves, `nothing to play on rule ${RuleId[rules.game.rule!.id]}`).toHaveLength(1)
  playAll(rules, moves[0])
}

const choosesZone = (zone: ActionZone) => (move: Move) =>
  isCustomMoveType<CustomMoveType, ActionZone>(CustomMoveType.ChooseAction)(move) && move.data === zone

const activates = (cell: XYCoordinates) => (move: Move) =>
  isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move) && !!move.data && sameCell(move.data, cell)

const upgrades = (cell: XYCoordinates) => (move: Move) => isMoveItemType(MaterialType.Tile)(move) && sameCell(cellOf(move.location), cell)

const gridTiles = (rules: LedaRules, player: number, cells: XYCoordinates[]) =>
  cells.map((cell) => tileAt(rules.material(MaterialType.Tile), player, cell).getItem<TileId>()?.id)

const hand = (rules: LedaRules, player: number) => rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(player)

/** Phase 1 of the first round, played the way the tutorial has the reader play it, square by square. */
const activateFirstZone = (rules: LedaRules) => {
  play(rules, tutorialPlayer, choosesZone(firstRoundZone))
  play(rules, tutorialPlayer, activates(scriptedCells.temporaryFood))
  play(rules, tutorialPlayer, activates(scriptedCells.temporaryUpgrade))
  play(rules, tutorialPlayer, upgrades(scriptedCells.permanentFood))
  play(rules, tutorialPlayer, activates(scriptedCells.permanentFood))
  play(rules, tutorialPlayer, activates(scriptedCells.permanentMilitary))
}

/**
 * Everything a player still has to answer, answered by the opponent of the tutorial: it plays until the game
 * stops asking that player anything, or until it reaches the rule the test wants to read the game on.
 */
const playOut = (rules: LedaRules, player: number, until?: RuleId, cap = 20) => {
  for (let move = 0; move < cap && rules.isTurnToPlay(player) && rules.game.rule?.id !== until; move++) {
    playAll(rules, aiMove(rules.game, player)!)
  }
}

describe('The tutorial setup', () => {
  it('deals the 2 clans the scenario is written for, and opens on the first round', () => {
    const rules = newGame()
    expect(playerClan(rules, tutorialPlayer)).toBe(Clan.Panda)
    expect(playerClan(rules, tutorialOpponent)).toBe(Clan.Shark)
    expect(rules.game.rule).toEqual({ id: RuleId.ChooseAction, player: tutorialPlayer })
    expect(playerFood(rules, tutorialPlayer)).toBe(1)
  })

  it('reveals the Action tile whose row 1 the reader is told to pick', () => {
    const rules = newGame()
    expect(revealedActionTile(rules.material(MaterialType.ActionTile))).toBe(ActionTileId.TopLeft)
    expect(rules.getLegalMoves(tutorialPlayer).filter(choosesZone(firstRoundZone))).toHaveLength(1)
  })

  it('gives the reader the King and 2 Pandas bought for 5 Food', () => {
    const rules = newGame()
    const cards = hand(rules, tutorialPlayer).getItems<ClanCardItemId>()
    expect(cards).toHaveLength(3)
    expect(cards.filter((card) => card.id!.front === ClanCardId.PandaKing)).toHaveLength(1)
    const bought = cards.filter((card) => card.id!.front !== ClanCardId.PandaKing)
    expect(bought.map((card) => clanCardFoodCost(card.id!.front, rules, tutorialPlayer))).toEqual([5, 5])
    expect(hand(rules, tutorialOpponent).length).toBe(3)
  })

  it('lays out the squares the tutorial points at', () => {
    const rules = newGame()
    expect(gridTiles(rules, tutorialPlayer, actionZoneCells[firstRoundZone])).toEqual([
      TileId.TemporaryFood,
      TileId.TemporaryUpgrade,
      TileId.PermanentFood,
      TileId.PermanentMilitary
    ])
    // The 2 squares the second round is read on: one crystal, and the Draw tile that is explained just before it.
    const secondZone = gridTiles(rules, tutorialPlayer, actionZoneCells[secondRoundZone])
    expect(secondZone).toContain(TileId.PermanentSpecialActivation)
    expect(secondZone).toContain(TileId.TemporaryDraw)
    // The second crystal is left to the shuffle: 2 of them in that row would promise 2 Awakenings at once.
    expect(secondZone).not.toContain(TileId.TemporarySpecialActivation)
    // The opponent gathers no military symbol at all: their own row 1 gives Food and nothing else.
    expect(gridTiles(rules, tutorialOpponent, actionZoneCells[firstRoundZone])).toEqual([
      TileId.TemporaryFood,
      TileId.PermanentFood,
      TileId.TemporaryFood,
      TileId.PermanentFood
    ])
  })

  it('leaves every square and every pile it does not name to the shuffle', () => {
    const scripted = [...actionZoneCells[firstRoundZone], { x: 0, y: 3 }, { x: 1, y: 3 }]
    const freeCells = gridCells.filter((cell) => !scripted.some((square) => sameCell(square, cell)))
    const grids = new Set(Array.from({ length: 30 }, () => gridTiles(newGame(), tutorialPlayer, freeCells).join()))
    expect(grids.size, 'the squares outside of the script are always laid out the same way').toBeGreaterThan(1)
    const piles = new Set(
      Array.from({ length: 30 }, () =>
        newGame()
          .material(MaterialType.ActionTile)
          .location(LocationType.ActionTileDeck)
          .sort((tile) => cellOf(tile.location).x!)
          .getItems<ActionTileId>()
          .map((tile) => tile.id)
          .join()
      )
    )
    expect(piles.size, 'the Action tiles under the 2 the script names are always in the same order').toBeGreaterThan(1)
  })
})

describe('The first round of the tutorial', () => {
  it('gives the reader 1 military symbol against none, and hands them the token that gives 1 Food', () => {
    const rules = newGame()
    activateFirstZone(rules)
    expect(rules.game.rule).toEqual({ id: RuleId.ActivateZone, player: tutorialOpponent })
    playOut(rules, tutorialOpponent)
    // Read on the organisation the conflict hands the round over to, the symbols being kept for the whole round.
    expect(militarySymbols(rules, tutorialPlayer)).toBe(1)
    expect(militarySymbols(rules, tutorialOpponent)).toBe(0)
    const tokens = rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory)
    expect(tokens.player(tutorialPlayer).getItems<MilitaryVictoryTokenId>().map((token) => token.id)).toEqual([MilitaryVictoryTokenId.Food])
    expect(tokens.player(tutorialOpponent).length).toBe(0)
    expect(victorySymbols(rules, tutorialPlayer)).toBe(1)
  })

  it('leaves the reader with the 5 Food their organisation is told they have', () => {
    const rules = newGame()
    activateFirstZone(rules)
    playOut(rules, tutorialOpponent)
    expect(rules.game.rule).toEqual({ id: RuleId.Organisation, player: tutorialPlayer })
    expect(playerFood(rules, tutorialPlayer)).toBe(5)
    // Which is exactly what one of the 2 Pandas of their hand costs, so a card is theirs to play.
    expect(rules.getLegalMoves(tutorialPlayer).some(isMoveItemType(MaterialType.ClanCard))).toBe(true)
  })

  it('hands the second round to the opponent, on the Action tile whose row 4 holds both crystals', () => {
    const rules = newGame()
    activateFirstZone(rules)
    playOut(rules, tutorialOpponent)
    playOut(rules, tutorialPlayer)
    playOut(rules, tutorialOpponent, RuleId.ChooseAction)
    expect(rules.game.rule).toEqual({ id: RuleId.ChooseAction, player: tutorialOpponent })
    expect(revealedActionTile(rules.material(MaterialType.ActionTile))).toBe(ActionTileId.BottomRight)
    expect(rules.getLegalMoves(tutorialOpponent).filter(choosesZone(secondRoundZone))).toHaveLength(1)
  })
})
