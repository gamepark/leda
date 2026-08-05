import { MaterialMove } from '@gamepark/rules-api'
import { Clan } from '../Clan'
import { actionZoneCells } from '../material/ActionZone'
import { ClanCardId, ClanCardItemId, clanOf } from '../material/ClanCardId'
import { isRing, Ring } from '../material/clanCards/catCards'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { gridTiles } from '../material/PlayerGrid'
import { Rules } from '../Rules'
import { roundZone } from './activation'
import { isMilitaryConflictPhase, militaryLead } from './militaryConflict'
import { topCardOn } from './playedCards'
import { upgradedTiles } from './tileChoices'

/**
 * The 4 Rings of the Cats and what each of them asks for before it may be put in play. 3 of them in play win the
 * game, so this is the whole of the race that clan runs (see {@link hasSpecialVictory}).
 *
 * A Ring is not bought: it is free, and no amount of Food ever plays one (see {@link cardFoodCost}). What it costs
 * is its condition, which the player has to have met when they put it in play, and which nothing keeps met: a deck
 * that fills back up or a tile a Scorpion turns back down closes the window again.
 *
 * Each of them names the phase of the round its window opens in, and 3 of the 4 name the same one: the moment a
 * player is done activating their zone, where the Pandas resolve their Awakenings (see {@link ActivateZoneRule}).
 * The Red Ring is the one of phase 2, what it asks for being settled by the conflict and by nothing else
 * (see {@link MilitaryVictoryRule}). Putting a Ring in play is never compulsory in either window.
 *
 * The app reads these to know which Rings to offer, and {@link PlaceRingRule} to know which moves are legal, so
 * that the two can never disagree.
 */

/** The symbols the Red Ring asks the conflict to have been won by. */
export const ringConflictLead = 3

/** The Cat cards the Purple Ring asks the activated zone to hold. */
export const ringCatCardsInZone = 3

/** The upgraded tiles the Orange Ring asks its owner to have. */
export const ringUpgradedTiles = 5

/**
 * The Cat cards a player has in the zone of the round, which is the zone both players have just activated.
 * The cards under another one are left out, being out of play: what a square holds is its top card alone
 * (see {@link topCardOn}).
 */
const catCardsInZone = (rules: Rules, player: number): number => {
  const zone = roundZone(rules)
  if (zone === undefined) return 0
  return actionZoneCells[zone].filter((cell) => {
    const card = topCardOn(rules, player, cell)
    return card !== undefined && clanOf(card) === Clan.Cat
  }).length
}

/** The cards a player still has to draw, which the Blue Ring asks to be none. */
const deckSize = (rules: Rules, player: number): number =>
  rules.material(MaterialType.ClanCard).location(LocationType.PlayerDeck).player(player).length

/**
 * The 2 windows a Ring may be put in play in, which are 2 phases of the round: 3 of the Rings ask about a state of
 * the game and are played at the end of an activation, while the Red one asks about the conflict and is played on
 * it. A window is read off the phase and not written down: the same rule serves the two, and which one it is
 * asking in is what the round is in the middle of (see {@link isMilitaryConflictPhase}).
 */
enum RingWindow {
  Activation = 1,
  MilitaryConflict
}

/** Which of the 2 is open, phase 3 and everything before the conflict being the activation window. */
const openWindow = (rules: Rules): RingWindow => (isMilitaryConflictPhase(rules) ? RingWindow.MilitaryConflict : RingWindow.Activation)

/** When each Ring may be put in play, and what it asks for there, both read off the card. */
const ringPlacements: Record<Ring, { window: RingWindow; condition: (rules: Rules, player: number) => boolean }> = {
  /**
   * Red. Win a military conflict by 3 symbols or more, which is a lead over the opponent and not a total.
   * The one Ring of the conflict, and the reason there is a window there at all: a lead is only a conflict won
   * once both players are done activating, so this is true there and nowhere else.
   */
  [ClanCardId.CatRingWinConflictByThree]: {
    window: RingWindow.MilitaryConflict,
    condition: (rules, player) => militaryLead(rules, player) >= ringConflictLead
  },

  /** Blue. Empty your deck, the one clan card pile a Cat player draws from. */
  [ClanCardId.CatRingEmptyDeck]: {
    window: RingWindow.Activation,
    condition: (rules, player) => deckSize(rules, player) === 0
  },

  /** Purple. Activate a zone holding at least 3 Cat cards, which are 3 of the 4 squares of the zone of the round. */
  [ClanCardId.CatRingThreeCatCards]: {
    window: RingWindow.Activation,
    condition: (rules, player) => catCardsInZone(rules, player) >= ringCatCardsInZone
  },

  /** Orange. Have 5 upgraded tiles, out of the 8 permanent ones a grid holds. */
  [ClanCardId.CatRingFiveUpgradedTiles]: {
    window: RingWindow.Activation,
    condition: (rules, player) => upgradedTiles(rules, player).length >= ringUpgradedTiles
  }
}

/** Whether that Ring is one of the window that is open, and whether what it asks for is true. */
const isPlayable = (rules: Rules, player: number, ring: Ring): boolean => {
  const { window, condition } = ringPlacements[ring]
  return window === openWindow(rules) && condition(rules, player)
}

/**
 * The Rings a player holds and may put in play right now. Only ever read from the seat of that player: a hand is
 * secret, so on the client of their opponent those cards have no front to be read as Rings at all.
 */
export const playableRings = (rules: Rules, player: number) =>
  rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayerHand)
    .player(player)
    .id<ClanCardItemId>((id) => id.front !== undefined && isRing(id.front) && isPlayable(rules, player, id.front))

/**
 * Putting one of them on any of the 16 squares of the player's own grid, whatever is already there: a Ring is a
 * clan card, and it is played on the tile of the square exactly as any other one is (see {@link playCardMoves}).
 */
export const ringMoves = (rules: Rules, player: number): MaterialMove<number, MaterialType, LocationType>[] => {
  const cards = rules.material(MaterialType.ClanCard)
  const parents = gridTiles(rules.material(MaterialType.Tile), player).getIndexes()
  return playableRings(rules, player)
    .getIndexes()
    .flatMap((index) => parents.map((parent) => cards.index(index).moveItem({ type: LocationType.PlayedCard, player, parent })))
}

/** Whether the window is worth opening at all: a player with no Ring to put in play is not asked anything. */
export const canPlaceRing = (rules: Rules, player: number): boolean => playableRings(rules, player).length > 0
