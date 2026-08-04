import { visibleDeserts } from '../../rules/tileChoices'
import { Rules } from '../../Rules'
import { ClanCardId, ClanCardItemId } from '../ClanCardId'
import { Effect, EffectQuantity } from '../Effect'
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
  [ClanCardId.ScorpionFoodPerDesertPair]: {
    cost: { food: 3 },
    effects: { [Effect.Food]: desertPairs }
  },

  /** Gain 1 Military per pair of Deserts you own. */
  [ClanCardId.ScorpionMilitaryPerDesertPair]: {
    cost: { food: 3 },
    effects: { [Effect.Military]: desertPairs }
  },

  /** Draw 1 card and gain 1 Food. */
  [ClanCardId.ScorpionDrawAndFood]: {
    cost: { food: 3 },
    effects: { [Effect.Draw]: 1, [Effect.Food]: 1 }
  },

  /** You may play a card from your hand, reducing its cost by 1 Food per pair of Deserts you own. */
  [ClanCardId.ScorpionDiscountPerDesertPair]: {
    cost: { food: 3 },
    effects: { [Effect.PlayCard]: desertPairs }
  },

  /** Activate the effect reminded on one of your Deserts. */
  [ClanCardId.ScorpionActivateDesert]: {
    cost: { food: 3 },
    effects: { [Effect.ActivateDesert]: 1 }
  },

  /** Upgrade one of your tiles, then activate it if possible. */
  [ClanCardId.ScorpionUpgradeAndActivate]: {
    cost: { food: 4 },
    effects: { [Effect.UpgradeAndActivateTile]: 1 }
  },

  /**
   * Gain 1 Food, then, if you control 1/2/3 Portals: Spy / + gain 1 Military / + activate one of your Deserts.
   * The 3 bonuses add up rather than replace one another, hence one threshold each: a Scorpion with 3 Portals in
   * play gains the Food, Spies, gains the Military and activates a Desert.
   */
  [ClanCardId.ScorpionFoodAndPortalBonus]: {
    cost: { food: 2 },
    effects: {
      [Effect.Food]: 1,
      [Effect.Spy]: withPortals(1),
      [Effect.Military]: withPortals(2),
      [Effect.ActivateDesert]: withPortals(3)
    }
  },

  /** Portal. Spy twice, on 2 different piles. */
  [ClanCardId.ScorpionPortalDoubleSpy]: {
    cost: { food: portalCost(cardsInHand) },
    effects: { [Effect.SpyDifferentPiles]: 2 }
  },

  /** Portal. Your opponent flips one of their tiles to its Desert or non-upgraded side. */
  [ClanCardId.ScorpionPortalFlipOpponentTile]: {
    cost: { food: portalCost(upgradedTiles) },
    effects: { [Effect.FlipOpponentTile]: 1 }
  },

  /** Portal. Swap the position of 2 of your cards or tiles. */
  [ClanCardId.ScorpionPortalSwap]: {
    cost: { food: portalCost(portalsPlayed) },
    effects: { [Effect.SwapSquares]: 1 }
  },

  /** Portal. No player may gain a Military Victory token this round. */
  [ClanCardId.ScorpionPortalBlockMilitaryVictory]: {
    cost: { food: portalCost(militaryVictoryTokens) },
    effects: { [Effect.BlockMilitaryVictory]: 1 }
  }
} satisfies Partial<Record<ClanCardId, ClanCardProperties>>

/**
 * The Deserts a player owns, counted in pairs: half of what most of these cards read the grid for. A Scorpion
 * spending their temporary tiles is not only losing them, which is what makes the clan work.
 *
 * Only the Deserts on the table are counted: a card played on a square covers its tile, and a Desert nobody can
 * see is a Desert nobody counts (see {@link visibleDeserts}).
 */
function desertPairs(rules: Rules, player: number): number {
  return Math.floor(visibleDeserts(rules, player).length / 2)
}

/** A bonus a card only gives once its owner controls that many Portals, and gives once and only once. */
function withPortals(threshold: number): EffectQuantity {
  return (rules, player) => (portalsPlayed(rules, player) >= threshold ? 1 : 0)
}

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
