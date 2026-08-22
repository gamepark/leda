import { Clan, clanCards, clanStart } from '@gamepark/leda/Clan'
import { LedaSetup } from '@gamepark/leda/LedaSetup'
import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { ActionZone } from '@gamepark/leda/material/ActionZone'
import { ClanCardId, ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { clanCardProperties } from '@gamepark/leda/material/clanCards/cardProperties'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { militaryVictoryTokens, MilitaryVictoryTokenId } from '@gamepark/leda/material/MilitaryVictoryTokenId'
import { cellOf, gridCells, sameCell } from '@gamepark/leda/material/PlayerGrid'
import { baseTiles, TileId } from '@gamepark/leda/material/TileId'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { sharkTokens } from '@gamepark/leda/rules/sharkPack'
import { getEnumValues, XYCoordinates } from '@gamepark/rules-api'

/**
 * The 2 sides of the tutorial table: the reader plays the Pandas, the machine plays the Sharks, which is the
 * pairing the rulebook recommends for a first game.
 */
export const tutorialPlayer = 1
export const tutorialOpponent = 2

/** A square the tutorial lays out itself, everything the script does not name being shuffled as usual. */
type ScriptedSquare = { cell: XYCoordinates; tile: TileId }

/**
 * The 4 squares of row 1 the tutorial walks the reader through, named after what stands on them and given in the
 * order the tutorial has them activated: 1 Food to show what a temporary tile becomes, an Upgrade to land on the
 * Food tile next to it, and the military symbol that wins the conflict of the round.
 * Named here rather than written twice, the tutorial pointing at the very squares this lays out.
 */
export const scriptedCells = {
  temporaryFood: { x: 0, y: 0 },
  temporaryUpgrade: { x: 1, y: 0 },
  permanentFood: { x: 2, y: 0 },
  permanentMilitary: { x: 3, y: 0 }
}

/**
 * The squares of the reader's grid the tutorial points at, and nothing else: row 1, the zone of the first round,
 * then the crystal and the Draw tile of row 4, which is the zone of the second one and all that round is about.
 * One crystal only: the second round is read and not played, and 2 crystals in the row the opponent opens would
 * promise the reader 2 Awakenings at once, which is a great deal more than the popup explaining the first one is
 * saying. The Draw tile takes the place of the temporary crystal, and is explained just before it.
 */
const pandaGrid: ScriptedSquare[] = [
  { cell: scriptedCells.temporaryFood, tile: TileId.TemporaryFood },
  { cell: scriptedCells.temporaryUpgrade, tile: TileId.TemporaryUpgrade },
  { cell: scriptedCells.permanentFood, tile: TileId.PermanentFood },
  { cell: scriptedCells.permanentMilitary, tile: TileId.PermanentMilitary },
  { cell: { x: 0, y: 3 }, tile: TileId.PermanentSpecialActivation },
  { cell: { x: 1, y: 3 }, tile: TileId.TemporaryDraw }
]

/**
 * Row 1 of the opponent, which they activate right after the reader: 4 tiles that give Food and nothing else, so
 * that they gather no military symbol at all and the first conflict is won 1 to 0.
 * A crystal would be worth 2 military symbols to the Sharks, hence none of those either.
 */
const sharkGrid: ScriptedSquare[] = [
  { cell: { x: 0, y: 0 }, tile: TileId.TemporaryFood },
  { cell: { x: 1, y: 0 }, tile: TileId.PermanentFood },
  { cell: { x: 2, y: 0 }, tile: TileId.TemporaryFood },
  { cell: { x: 3, y: 0 }, tile: TileId.PermanentFood }
]

/**
 * The zone of each of the 2 rounds the tutorial goes through: row 1, which the reader is told to pick, then row 4,
 * which their opponent picks and which holds the crystal and the Draw tile of the reader.
 */
export const firstRoundZone = ActionZone.Row1
export const secondRoundZone = ActionZone.Row4

/**
 * The 2 Action tiles those zones are read off, laid on top of the pile in the order they are revealed: tile 1
 * offers row 1, tile 4 offers row 4.
 * The pile is drawn from its highest x, which is the last tile created, so the list is written bottom up.
 */
const scriptedActionTiles = [ActionTileId.BottomRight, ActionTileId.TopLeft]

/**
 * The table the tutorial opens on.
 *
 * The scenario is fixed - the reader plays the Pandas, opens the first round on row 1 and wins its conflict - so
 * everything that scenario names is laid out by hand: the 2 clans, the squares the tutorial points at, the first 2
 * Action tiles and the first Military Victory token. Everything else is still shuffled, so that no two readers end
 * the tutorial on quite the same board.
 *
 * The clans are taken here rather than picked, and the starting hands are kept rather than looked at: the tutorial
 * opens on the first round of a game, and the 2 steps of the setup a player answers ({@link RuleId.ChooseClan} and
 * {@link RuleId.Mulligan}) would be 2 questions asked before a single rule has been explained.
 */
export class LedaTutorialSetup extends LedaSetup {
  setupMaterial() {
    this.setupScriptedGrid(tutorialPlayer, pandaGrid)
    this.setupScriptedGrid(tutorialOpponent, sharkGrid)
    this.setupScriptedActionTiles()
    this.setupScriptedMilitaryVictoryTokens()
    this.setupClan(tutorialPlayer, Clan.Panda)
    this.setupClan(tutorialOpponent, Clan.Shark)
    this.dealPandaHand(tutorialPlayer)
    this.dealHand(tutorialOpponent, clanStart[Clan.Shark].cards)
  }

  /**
   * The 16 tiles of a player, with the ones the script names already on their square and the rest laid on the
   * squares it left alone. Shuffling swaps the tiles between the squares it is given and leaves the squares
   * themselves in place (see {@link LedaSetup.setupGrid}), so the scripted squares are simply left out of it.
   */
  private setupScriptedGrid(player: number, script: ScriptedSquare[]) {
    const shuffled = [...baseTiles]
    for (const { tile } of script) shuffled.splice(shuffled.indexOf(tile), 1)
    const freeCells = gridCells.filter((cell) => !script.some((square) => sameCell(square.cell, cell)))
    this.material(MaterialType.Tile).createItems([
      ...script.map(({ cell, tile }) => ({ id: tile, location: { type: LocationType.PlayerGrid, player, ...cell } })),
      ...shuffled.map((tile, index) => ({ id: tile, location: { type: LocationType.PlayerGrid, player, ...freeCells[index] } }))
    ])
    this.material(MaterialType.Tile)
      .player(player)
      .location((location) => freeCells.some((cell) => sameCell(cell, cellOf(location))))
      .shuffle()
  }

  /** The 5 Action tiles, the 2 the tutorial names on top and the 3 others shuffled under them. */
  private setupScriptedActionTiles() {
    const rest = getEnumValues(ActionTileId).filter((tile) => !scriptedActionTiles.includes(tile))
    this.material(MaterialType.ActionTile).createItems(
      [...rest, ...scriptedActionTiles].map((id) => ({ id, location: { type: LocationType.ActionTileDeck } }))
    )
    this.shuffleUnder(MaterialType.ActionTile, rest.length)
  }

  /**
   * The 18 Military Victory tokens, the one that gives 1 Food on top: it is the token the reader wins on the first
   * conflict, and the 5th Food the tutorial counts on for their organisation comes from it.
   */
  private setupScriptedMilitaryVictoryTokens() {
    const rest = [...militaryVictoryTokens]
    rest.splice(rest.indexOf(MilitaryVictoryTokenId.Food), 1)
    this.material(MaterialType.MilitaryVictoryToken).createItems(
      [...rest, MilitaryVictoryTokenId.Food].map((id) => ({ id, location: { type: LocationType.MilitaryVictoryDeck } }))
    )
    this.shuffleUnder(MaterialType.MilitaryVictoryToken, rest.length)
  }

  /**
   * A pile shuffled everywhere but on top: the items the sequence strategy numbered below `top` swap places, and
   * the ones above them stay where the script put them.
   */
  private shuffleUnder(type: MaterialType, top: number) {
    this.material(type)
      .location((location) => location.x! < top)
      .shuffle()
  }

  /**
   * What {@link ChooseClanRule} hands a player once they have picked a clan, given here instead: their deck, the
   * extra material of their clan, their Victory condition card and their starting Food.
   */
  private setupClan(player: number, clan: Clan) {
    this.material(MaterialType.ClanCard).createItems(
      clanCards(clan).map((front) => ({ id: { front, back: clan }, location: { type: LocationType.PlayerDeck, player } }))
    )
    if (clan === Clan.Shark) {
      this.material(MaterialType.SharkToken).createItem({ location: { type: LocationType.PlayerSharkSupply, player }, quantity: sharkTokens })
    }
    this.material(MaterialType.VictoryConditionCard).createItem({ id: clan, location: { type: LocationType.PlayerVictoryCondition, player } })
    this.deckOf(player).shuffle()
    this.material(MaterialType.FoodToken).createItem({ location: { type: LocationType.PlayerFood, player }, quantity: clanStart[clan].food })
  }

  /**
   * The hand the tutorial talks about: the King, which no Food ever buys and which its owner has to awaken their
   * way up to, and 2 of the Pandas that are bought for 5 Food.
   * Which 2 is left to the shuffle, the tutorial only ever saying what they cost: they are simply the first 2 cards
   * of the deck that are bought at all.
   */
  private dealPandaHand(player: number) {
    this.material(MaterialType.ClanCard)
      .location(LocationType.PlayerDeck)
      .player(player)
      .id<ClanCardItemId>((id) => id.front === ClanCardId.PandaKing)
      .moveItem({ type: LocationType.PlayerHand, player })
    this.deckOf(player)
      .id<ClanCardItemId>((id) => clanCardProperties[id.front].cost !== undefined)
      .limit(clanStart[Clan.Panda].cards - 1)
      .moveItems({ type: LocationType.PlayerHand, player })
  }

  private dealHand(player: number, cards: number) {
    this.deckOf(player).limit(cards).moveItems({ type: LocationType.PlayerHand, player })
  }

  /** deck() draws from the highest x, which is the top of the pile the DeckLocator stacks. */
  private deckOf(player: number) {
    return this.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(player).deck()
  }

  /** The tutorial opens on the first round, the reader being the active player of it. */
  start() {
    this.startPlayerTurn(RuleId.ChooseAction, tutorialPlayer)
  }
}
