import { Clan } from '@gamepark/leda/Clan'
import { LedaOptions } from '@gamepark/leda/LedaOptions'
import { ActionZone, actionZoneCells } from '@gamepark/leda/material/ActionZone'
import { ClanCardId, ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { clanCardProperties } from '@gamepark/leda/material/clanCards/cardProperties'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { cellOf, gridTiles, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { TileId } from '@gamepark/leda/material/TileId'
import { awakeningGroup } from '@gamepark/leda/rules/awakening'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { goldPandasToWin, victorySymbolsToWin } from '@gamepark/leda/rules/victory'
import { MaterialTutorial, TutorialStep } from '@gamepark/react-game'
import { isCreateItemType, isCustomMoveType, isMoveItemType, isStartRule, MaterialGame, MaterialMove, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { militaryVictoryFlight } from '../locators/Locators'
import { actionTile } from '../material/ActionTileDescription'
import { militaryVictoryToken } from '../material/MilitaryVictoryTokenDescription'
import { gridGap, tileSize } from '../material/TileDescription'
import { HelpText } from '../material/helpLayout'
import { firstRoundZone, LedaTutorialSetup, scriptedCells, secondRoundZone, tutorialOpponent, tutorialPlayer } from './LedaTutorialSetup'
import { aiMove } from './TutorialAI'

type Game = MaterialGame<number, MaterialType, LocationType>
type Move = MaterialMove<number, MaterialType, LocationType>
type Rules = MaterialRules<number, MaterialType, LocationType>
type Step = TutorialStep<number, MaterialType, LocationType>

/**
 * How many times the Pandas have to trigger their Awakening to bring both of their Gold Pandas into play, which the
 * rulebook states rather than derives: 2 Bronze raise a Silver, twice, then 2 Silver raise a Gold, twice, and the
 * Bronze that came back into hand has to be played again in between (see {@link AwakeningRule}).
 */
const awakeningsToWin = 5

/** One popup of the tutorial, written in the translation files the way the help dialogs are (see {@link HelpText}). */
const text = (code: string, values?: Record<string, unknown>) => () => <HelpText code={`tutorial.${code}`} values={values} />

/**
 * The very text a help dialog reads, for a rule the tutorial has no reason to word a second time: 2 wordings of
 * one rule are 2 things to keep true, and the reader meets the help one again every time they open that dialog.
 */
const helpText = (code: string, values?: Record<string, unknown>) => () => <HelpText code={code} values={values} />

/** The zone the reader, or their opponent, is being asked to pick on the Action tile of the round. */
const choosesZone =
  (zone: ActionZone) =>
  (move: Move): boolean =>
    isCustomMoveType<CustomMoveType, ActionZone>(CustomMoveType.ChooseAction)(move) && move.data === zone

/** The square of their own grid the reader is being asked to activate. */
const activates =
  (cell: XYCoordinates) =>
  (move: Move): boolean =>
    isCustomMoveType<CustomMoveType, XYCoordinates>(CustomMoveType.ActivateSquare)(move) && move.data !== undefined && sameCell(move.data, cell)

/** The tile of their own grid the reader is being asked to upgrade, which an Upgrade effect turns over. */
const upgrades =
  (cell: XYCoordinates) =>
  (move: Move): boolean =>
    isMoveItemType(MaterialType.Tile)(move) && move.location.player === tutorialPlayer && sameCell(cellOf(move.location), cell)

/**
 * The Desert a temporary tile of the reader becomes as it is activated, which is the last thing an activation
 * gives (see {@link activateTile}): held back until the popup that announces it has been read, so that what the
 * reader is told about is what is about to happen to a tile still showing its front, and not what has already
 * happened to it.
 */
const becomesDesert =
  (cell: XYCoordinates) =>
  (move: MaterialMove): boolean =>
    isMoveItemType(MaterialType.Tile)(move) &&
    move.location.player === tutorialPlayer &&
    move.location.rotation === true &&
    sameCell(cellOf(move.location), cell)

/**
 * The military conflict of the round, held back until the popups that announce it have been read: the opponent
 * finishing their zone opens it on the spot, and phase 2 would be settled before phase 1 has been said to be over.
 * Only ever reached once the last square of a zone is done, so every square of the opponent may carry it.
 */
const conflict = (move: MaterialMove): boolean => isStartRule(move) && move.id === RuleId.MilitaryConflict

/**
 * The Food a Military Victory token hands its winner, which is what the token of this round gives on top of its
 * Victory symbol. Held back like the Desert of a temporary tile, so that the popup that names the bonus is read
 * before the Food appears in front of the reader.
 */
const gainsFood = (move: MaterialMove): boolean =>
  isCreateItemType(MaterialType.FoodToken)(move) && move.item.location.player === tutorialPlayer

/**
 * Where a popup is laid, and how much empty table its focus keeps on that side for it.
 *
 * What a step points at is centered on the screen, so a popup left in the middle of it would be read over the very
 * material it names. The screen is exactly 100em tall - the framework makes 1em one hundredth of it - and, for a
 * table of 2 grids side by side, never far from twice as wide: a quarter of a screen aside clears the middle, and
 * a popup of 60em still fits in the half that leaves. The mirror of each of these exists the day a step needs it.
 *
 * The room kept for it is a margin of the focus, counted in the centimeters the material is measured in: worth
 * exactly what it is put next to, it lands the edge of the material on the middle of the screen, whichever of the
 * 2 dimensions the zoom is bound by. The popup then opens right where the material stops, which is the whole
 * point: what is being read and what is being pointed at have to be taken in together.
 *
 * That holds as long as the focus may center what it points at. It may not when that material sits against an
 * edge of the table - a clan card, a column of tokens, the Food of a player - since the table is never panned
 * past its own edge: such material stays in the corner of the screen it is in, and a margin moves it no further.
 * The popup of such a step is simply left where the framework puts it, in the middle and at its widest: the
 * material being against an edge, the middle is the nearest place there is, and the wider the popup the nearer
 * its own edge comes to it.
 */
const popupRight = { position: { x: 30 }, size: { width: 60 } }
const popupBelow = { position: { y: 25 } }
const popupAbove = { position: { y: -25 } }
/** The bottom left corner, for the Food a player keeps under their deck, which is as far down the table as it gets. */
const popupOverFood = { position: { x: -10, y: 20 } }
const roomRight = (width: number) => ({ margin: { right: width } })
const roomBelow = (height: number) => ({ margin: { bottom: height } })

/** How much table a player's grid takes, 4 squares and the 3 gaps between them, across as well as down. */
const gridSize = 4 * tileSize + 3 * gridGap

/** The squares of the zone the opponent activates, one step per square, the way the reader has just gone through theirs. */
const opponentActivations = (count: number): Step[] =>
  Array.from({ length: count }, () => ({ move: { player: tutorialOpponent, interrupt: conflict } }))

/**
 * The scripted part of a game of LEDA: 2 rounds played against the Sharks, at the end of which the reader takes the
 * game over and plays it out against the machine (see {@link aiMove}).
 *
 * The 3 phases of a round are gone through in order, and everything the reader is told about is something they do
 * rather than something they watch: they pick the zone of the first round, activate its 4 squares one by one, and
 * organise their grid however they like. What is only explained is what a first game does not have to decide: their
 * clan, their starting hand, and the second round, which is their opponent's to open.
 *
 * The table is laid out for that scenario, and everything the scenario does not name is shuffled
 * (see {@link LedaTutorialSetup}).
 */
export class LedaTutorial extends MaterialTutorial<number, MaterialType, LocationType> {
  version = 1

  options: LedaOptions = { players: 2 }

  setup = new LedaTutorialSetup()

  players = [
    { id: tutorialPlayer },
    {
      id: tutorialOpponent,
      name: 'Sharky',
      avatar: {
        topType: 'ShortHairShortFlat',
        accessoriesType: 'Sunglasses',
        hairColor: 'Black',
        facialHairType: 'Blank',
        clotheType: 'GraphicShirt',
        graphicType: 'Skull',
        clotheColor: 'Black',
        eyeType: 'Default',
        eyebrowType: 'DefaultNatural',
        mouthType: 'Grimace',
        skinColor: 'Light'
      }
    }
  ]

  steps: Step[] = [
    { popup: { text: text('welcome') } },

    /**
     * The setup: the 2 clans, and the card that says how each of them wins. The 2 cards are in opposite corners of
     * the table, so no popup is ever near both: the widest one, kept in the middle and just under them, is the one
     * that leaves the least distance to either.
     */
    {
      popup: { text: text('clans') },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.material(game, MaterialType.VictoryConditionCard)] })
    },
    {
      popup: { text: text('victory-condition', { gold: goldPandasToWin, victory: victorySymbolsToWin[Clan.Panda] }) },
      focus: (game) => ({ materials: [this.myVictoryCondition(game)] })
    },
    {
      popup: { text: text('grid'), ...popupRight },
      focus: (game) => ({ ...roomRight(gridSize), materials: [this.myTiles(game)] })
    },

    /** Phase 1: the Action tile of the round, the zones it offers, and the 4 squares the reader picks. */
    {
      popup: { text: text('action-tile'), ...popupRight },
      focus: (game) => ({ ...roomRight(actionTile.width), materials: [this.revealedActionTiles(game)] })
    },
    /**
     * The 3 zones the tile offers are read on the tile itself: nothing is drawn over the grids until the step that
     * asks for one of them, the rectangles following the moves rather than the tile (see {@link offeredZones}).
     */
    {
      popup: { text: text('choose-zone'), ...popupRight },
      focus: (game) => ({ ...roomRight(actionTile.width), materials: [this.lastRevealedActionTile(game)] })
    },
    {
      popup: { text: text('choose-row'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTilesIn(game, actionZoneCells[firstRoundZone])] }),
      move: { filter: choosesZone(firstRoundZone) }
    },
    {
      popup: { text: text('activate-order'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTilesIn(game, actionZoneCells[firstRoundZone])] })
    },

    /**
     * The first square: what a temporary tile gives, and what it becomes once it has given it. The Desert is held
     * back between the 2 steps (see {@link becomesDesert}), so that the reader reads what is going to happen to
     * the tile while it is still on its front, and sees it happen as they close the popup that told them.
     */
    {
      popup: { text: text('temporary-food'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTileAt(game, scriptedCells.temporaryFood)] }),
      move: { filter: activates(scriptedCells.temporaryFood), interrupt: becomesDesert(scriptedCells.temporaryFood) }
    },
    {
      popup: { text: text('desert'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTileAt(game, scriptedCells.temporaryFood)] }),
      move: {}
    },
    /**
     * The Food of a player, and their hand right under it, are both pinned to the bottom of the table: a focus can
     * bring the corner of the table they sit in to the corner of the screen and no further, so there is no room to
     * keep for the popup there, and the popup is laid on the side they leave free instead.
     */
    {
      popup: { text: text('food-stock'), ...popupOverFood },
      focus: (game) => ({ materials: [this.material(game, MaterialType.FoodToken).player(tutorialPlayer)] })
    },
    {
      popup: { text: text('food-use'), ...popupAbove },
      focus: (game) => ({ materials: [this.myBoughtCards(game)] })
    },

    /** The second square: an Upgrade, landed on the third one so that activating it is worth twice as much. */
    {
      popup: { text: text('temporary-upgrade'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTileAt(game, scriptedCells.temporaryUpgrade)] }),
      move: { filter: activates(scriptedCells.temporaryUpgrade) }
    },
    {
      popup: { text: text('upgrade-target'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTileAt(game, scriptedCells.permanentFood)] }),
      move: { filter: upgrades(scriptedCells.permanentFood) }
    },
    {
      popup: { text: text('upgraded'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTileAt(game, scriptedCells.permanentFood)] }),
      move: { filter: activates(scriptedCells.permanentFood) }
    },

    /** The last square: the military symbol the conflict of the round is won with. */
    {
      popup: { text: text('military-tile'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTileAt(game, scriptedCells.permanentMilitary)] }),
      move: { filter: activates(scriptedCells.permanentMilitary) }
    },

    /** The opponent activates the same zone of their own grid, and phase 1 is over. */
    {
      popup: { text: text('opponent-activates'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.tilesIn(game, tutorialOpponent, actionZoneCells[firstRoundZone])] })
    },
    ...opponentActivations(actionZoneCells[firstRoundZone].length),

    /** Phase 2: the conflict, which the 3 popups below have held back (see {@link conflict}). */
    { popup: { text: text('conflict-start') } },
    { popup: { text: text('conflict-rule') } },
    /**
     * The pile the token is about to be drawn from, with the whole way to the column of the reader kept in sight:
     * the token flies there as the popup is closed, and a zoom tight on the pile would have it leave the screen on
     * its way. Hence the margins of the flight itself (see {@link militaryVictoryFlight}), the column of a player
     * being at the edge of the table and higher up than the pile, and the small ones that keep the pile off the
     * corner of the screen they push it into.
     * The popup keeps to the middle of the screen, between the pile it names and the corner the token is bound
     * for: the whole width of the table being in sight, there is no side of it left to lay the popup on.
     */
    {
      popup: { text: text('conflict-won') },
      focus: (game) => ({
        margin: { ...militaryVictoryFlight, right: tileSize, bottom: militaryVictoryToken.height },
        materials: [this.militaryVictoryDeck(game)]
      }),
      move: { interrupt: gainsFood }
    },
    /**
     * The token the conflict has just handed over, read in the column it has landed in: the move that takes it
     * there is played out before this step comes up, the interrupt of the step before it holding back the Food it
     * gives and nothing else, so the focus has a token to point at rather than one halfway across the table.
     * The Food itself lands as this popup is closed, which is what the popup announces.
     */
    {
      popup: { text: text('token') },
      focus: (game) => ({ materials: [this.myMilitaryVictoryTokens(game)] }),
      move: {}
    },
    {
      popup: { text: text('military-victory', { count: victorySymbolsToWin[Clan.Panda] }) },
      focus: (game) => ({ materials: [this.myVictoryCondition(game), this.myMilitaryVictoryTokens(game)] })
    },

    /** Phase 3: the organisation, which the reader plays however they like. */
    { popup: { text: text('organisation-start') } },
    { popup: { text: text('organisation-rule') } },
    {
      popup: { text: text('your-organisation'), ...popupRight },
      focus: (game) => ({ ...roomRight(gridSize), materials: [this.myHand(game), this.myTiles(game)] }),
      move: {}
    },
    { popup: { text: text('opponent-organisation') } },
    { move: { player: tutorialOpponent } },

    /** The second round, which the opponent opens: only the crystals of it are worth stopping on. */
    {
      popup: { text: text('new-round'), ...popupRight },
      focus: (game) => ({ ...roomRight(actionTile.width), materials: [this.lastRevealedActionTile(game)] })
    },
    { popup: { text: text('opponent-chooses') } },
    { move: { player: tutorialOpponent, filter: choosesZone(secondRoundZone) } },
    /**
     * The row the opponent has just opened, in the grid of the reader: a zone is picked once and activated by both
     * players, so the choice of the opponent is what the reader is about to answer in their own 4 squares.
     */
    {
      popup: { text: text('row-chosen'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myTilesIn(game, actionZoneCells[secondRoundZone])] })
    },
    /**
     * The 2 squares of the row the opponent has just opened, read one after the other and the Draw one first: the
     * crystal opens onto the Special activation, the Awakening and the clan victory the tutorial ends on, so it is
     * the one that hands the reader over to the last popups rather than the one that interrupts them.
     */
    {
      popup: { text: text('draw'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.myDrawTile(game)] })
    },
    {
      popup: { text: text('special-activation'), ...popupBelow },
      focus: (game) => ({ ...roomBelow(tileSize), materials: [this.mySpecialActivationTile(game)] })
    },
    {
      popup: { text: text('shark-activation') },
      focus: (game) => ({ materials: [this.material(game, MaterialType.VictoryConditionCard).player(tutorialOpponent)] })
    },
    {
      popup: { text: text('panda-activation') },
      focus: (game) => ({ materials: [this.myVictoryCondition(game)] })
    },
    { popup: { text: helpText('help.note.awakening', { count: awakeningGroup }) } },
    /** The King in the hand and the deck at the far edge of the table stand about a grid apart, hence the room. */
    {
      popup: { text: text('clan-victory', { gold: goldPandasToWin, awakenings: awakeningsToWin }), ...popupRight },
      focus: (game) => ({ ...roomRight(gridSize), materials: [this.myKing(game), this.myDeck(game)] })
    },
    { popup: { text: text('end') } },
    { popup: { text: text('good-luck') } }
  ]

  /**
   * What the opponent plays while the tutorial still has something to say, which the framework would otherwise pick
   * at random: the same opponent the reader plays against once the script runs out (see {@link aiMove}).
   * The moves it reads are the ones the step allows, the framework filtering them before they ever reach it.
   */
  getNextMove(rules: Rules): Move | undefined {
    const step = rules.game.tutorial && this.steps[rules.game.tutorial.step]
    const player = step?.move?.player
    if (player === undefined || player === rules.game.players[0]) return undefined
    return aiMove(rules.game, player)
  }

  private myVictoryCondition(game: Game) {
    return this.material(game, MaterialType.VictoryConditionCard).player(tutorialPlayer)
  }

  private myTiles(game: Game) {
    return gridTiles(this.material(game, MaterialType.Tile), tutorialPlayer)
  }

  private myTileAt(game: Game, cell: XYCoordinates) {
    return this.myTilesIn(game, [cell])
  }

  private myTilesIn(game: Game, cells: XYCoordinates[]) {
    return this.tilesIn(game, tutorialPlayer, cells)
  }

  private tilesIn(game: Game, player: number, cells: XYCoordinates[]) {
    return gridTiles(this.material(game, MaterialType.Tile), player).location((location) => cells.some((cell) => sameCell(cell, cellOf(location))))
  }

  /**
   * The 2 squares the second round is read on, wherever they stand: an organisation may have swapped them out of
   * their row. The crystal is the permanent one, the temporary one being left to the shuffle and standing anywhere
   * (see the grid the tutorial lays out in {@link LedaTutorialSetup}).
   */
  private mySpecialActivationTile(game: Game) {
    return this.myTiles(game).id<TileId>(TileId.PermanentSpecialActivation)
  }

  private myDrawTile(game: Game) {
    return this.myTiles(game).id<TileId>(TileId.TemporaryDraw)
  }

  private myHand(game: Game) {
    return this.material(game, MaterialType.ClanCard).location(LocationType.PlayerHand).player(tutorialPlayer)
  }

  private myDeck(game: Game) {
    return this.material(game, MaterialType.ClanCard).location(LocationType.PlayerDeck).player(tutorialPlayer)
  }

  /** The cards of the starting hand that are bought with Food, which are the 2 the tutorial prices. */
  private myBoughtCards(game: Game) {
    return this.myHand(game).id<ClanCardItemId>((id) => clanCardProperties[id.front].cost !== undefined)
  }

  private myKing(game: Game) {
    return this.myHand(game).id<ClanCardItemId>((id) => id.front === ClanCardId.PandaKing)
  }

  /**
   * The top of the pile of Military Victory tokens, which is the very token the conflict is about to hand out.
   * That token and not the pile it is on: a deck only draws its last few items (see the limit of its locator),
   * while a focus waits for every item it names to reach the table before it zooms, so a pile of 18 would keep it
   * waiting for good. The top one is always drawn, and is what the popup calls the first token.
   */
  private militaryVictoryDeck(game: Game) {
    return this.material(game, MaterialType.MilitaryVictoryToken)
      .location(LocationType.MilitaryVictoryDeck)
      .sort((token) => -token.location.x!)
      .limit(1)
  }

  private myMilitaryVictoryTokens(game: Game) {
    return this.material(game, MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(tutorialPlayer)
  }

  private revealedActionTiles(game: Game) {
    return this.material(game, MaterialType.ActionTile).location(LocationType.ActionTileRevealed)
  }

  /** The Action tile of the round: the last one turned face up, which the location strategy numbered highest. */
  private lastRevealedActionTile(game: Game) {
    return this.revealedActionTiles(game)
      .sort((tile) => -tile.location.x!)
      .limit(1)
  }
}
