import { Rules } from '../../Rules'
import { ClanCardId, ClanCardItemId } from '../ClanCardId'
import { LocationType } from '../LocationType'
import { MaterialType } from '../MaterialType'
import { gridTiles } from '../PlayerGrid'
import { isPermanent } from '../TileEffect'
import { TileId } from '../TileId'
import { ClanCardProperties, FoodCost } from './ClanCardProperties'

/**
 * The 11 cards of the Scorpions, read off REGLES LEDA SCORPIONS.pdf.
 *
 * They have no keyword of their own: most of them scale with the number of Deserts in their owner's grid, which
 * turns the tiles a Scorpion has spent into something worth having. Their 4 Portals win the game if they end up
 * in the 4 corners of the grid, and each gets cheaper as its own counter goes up.
 */
export const scorpionCards = {
  /** Gain 1 Food per pair of Deserts you own. */
  [ClanCardId.ScorpionFoodPerDesertPair]: { cost: { food: 3 } },

  /** Gain 1 Military per pair of Deserts you own. */
  [ClanCardId.ScorpionMilitaryPerDesertPair]: { cost: { food: 3 } },

  /** Draw 1 card and gain 1 Food. */
  [ClanCardId.ScorpionDrawAndFood]: { cost: { food: 3 } },

  /** You may play a card from your hand, reducing its cost by 1 Food per pair of Deserts you own. */
  [ClanCardId.ScorpionDiscountPerDesertPair]: { cost: { food: 3 } },

  /** Activate the effect reminded on one of your Deserts. */
  [ClanCardId.ScorpionActivateDesert]: { cost: { food: 3 } },

  /** Upgrade one of your tiles, then activate it if possible. */
  [ClanCardId.ScorpionUpgradeAndActivate]: { cost: { food: 4 } },

  /** Gain 1 Food, then, if you control 1/2/3 Portals: Spy / + gain 1 Military / + activate one of your Deserts. */
  [ClanCardId.ScorpionFoodAndPortalBonus]: { cost: { food: 2 } },

  /** Portal. Spy twice, on 2 different piles. */
  [ClanCardId.ScorpionPortalDoubleSpy]: { cost: { food: portalCost(cardsInHand) } },

  /** Portal. Your opponent flips one of their tiles to its Desert or non-upgraded side. */
  [ClanCardId.ScorpionPortalFlipOpponentTile]: { cost: { food: portalCost(upgradedTiles) } },

  /** Portal. Swap the position of 2 of your cards or tiles. */
  [ClanCardId.ScorpionPortalSwap]: { cost: { food: portalCost(portalsPlayed) } },

  /** Portal. No player may gain a Military Victory token this round. */
  [ClanCardId.ScorpionPortalBlockMilitaryVictory]: { cost: { food: portalCost(militaryVictoryTokens) } }
} satisfies Partial<Record<ClanCardId, ClanCardProperties>>

/** The 4 Portals, which are Scorpion cards like the others until they reach the 4 corners of the grid. */
export const portals: ClanCardId[] = [
  ClanCardId.ScorpionPortalDoubleSpy,
  ClanCardId.ScorpionPortalFlipOpponentTile,
  ClanCardId.ScorpionPortalSwap,
  ClanCardId.ScorpionPortalBlockMilitaryVictory
]

export const isPortal = (card: ClanCardId): boolean => portals.includes(card)

/**
 * Every Portal costs 9 minus a counter of its own, so that the Scorpions get their win condition cheaper the
 * further along they are. Never below 0: nothing says a counter cannot go past 9, and 16 tiles can be upgraded.
 */
function portalCost(counter: (rules: Rules, player: number) => number): FoodCost {
  return (rules, player) => Math.max(0, 9 - counter(rules, player))
}

function cardsInHand(rules: Rules, player: number): number {
  return rules.material(MaterialType.ClanCard).location(LocationType.PlayerHand).player(player).length
}

/** Upgraded tiles, which only permanent ones can be: the flipped face of a temporary tile is a Desert. */
function upgradedTiles(rules: Rules, player: number): number {
  return gridTiles(rules.material(MaterialType.Tile), player).getItems<TileId>().filter((tile) => tile.location.rotation === true && isPermanent(tile.id))
    .length
}

/** The Portals their owner has already played onto their grid. */
function portalsPlayed(rules: Rules, player: number): number {
  return rules
    .material(MaterialType.ClanCard)
    .location(LocationType.PlayedCard)
    .player(player)
    .getItems<ClanCardItemId>()
    .filter((card) => isPortal(card.id!.front)).length
}

function militaryVictoryTokens(rules: Rules, player: number): number {
  return rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.PlayerMilitaryVictory).player(player).length
}
