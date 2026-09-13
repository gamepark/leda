import { eggCost, playedEggs, withSnakes } from '../../rules/snake'
import { Rules } from '../../Rules'
import { ClanCardId } from '../ClanCardId'
import { Effect } from '../Effect'
import { ClanCardProperties } from './ClanCardProperties'

/**
 * The 11 cards of the Snakes, read off REGLES LEDA SERPENT.pdf.
 *
 * Every one of them costs the same 2 Food, that price being printed on the Egg they are all played as and not on
 * the Snake they turn out to be: what a player pays for is an Egg, and their opponent is not told which
 * (see {@link snake}).
 *
 * Half of them print a Hatching effect, given once, the round the Egg opens, before whatever the card gives when
 * it is activated (see {@link hatchCard}). The other half print none, and 3 of those only give anything at all
 * once their owner has enough Snakes out: the clan is worth more the further along it is, which is the whole of
 * what it plays for.
 */
export const snakeCards = {
  /** Hatching: steal 1 Food. Effect: gain 1 Military. */
  [ClanCardId.SnakeStealFoodAndMilitary]: {
    cost: { food: eggCost },
    secondEffects: { [Effect.StealFood]: 1 },
    effects: { [Effect.Military]: 1 }
  },

  /** Hatching: draw 1 card. Effect: flip one of your Deserts. */
  [ClanCardId.SnakeDrawAndFlipDesert]: {
    cost: { food: eggCost },
    secondEffects: { [Effect.Draw]: 1 },
    effects: { [Effect.Flip]: 1 }
  },

  /** Hatching: Spy. Effect: if you have 2 Snakes in play (this one included), upgrade one of your tiles. */
  [ClanCardId.SnakeSpyAndUpgrade]: {
    cost: { food: eggCost },
    secondEffects: { [Effect.Spy]: 1 },
    effects: { [Effect.Upgrade]: withSnakes(2) }
  },

  /** Hatching: gain 2 Military. Effect: none, which is what makes it the cheapest Military of the clan. */
  [ClanCardId.SnakeMilitary]: {
    cost: { food: eggCost },
    secondEffects: { [Effect.Military]: 2 }
  },

  /** Hatching: draw 1 card. Effect: gain 1 Food for each of your Eggs. */
  [ClanCardId.SnakeDrawAndFoodPerEgg]: {
    cost: { food: eggCost },
    secondEffects: { [Effect.Draw]: 1 },
    effects: { [Effect.Food]: eggs }
  },

  /** Hatching: steal 1 Food. Effect: move one of your Eggs. */
  [ClanCardId.SnakeStealFoodAndMoveEgg]: {
    cost: { food: eggCost },
    secondEffects: { [Effect.StealFood]: 1 },
    effects: { [Effect.MoveEgg]: 1 }
  },

  /** Effect: Spy, then gain 1 Military. */
  [ClanCardId.SnakeSpyAndMilitary]: {
    cost: { food: eggCost },
    effects: { [Effect.Spy]: 1, [Effect.Military]: 1 }
  },

  /** Effect: if you have 3 Snakes in play (this one included), gain 2 Military. */
  [ClanCardId.SnakeMilitaryWithThreeSnakes]: {
    cost: { food: eggCost },
    effects: { [Effect.Military]: withSnakes(3, 2) }
  },

  /** Effect: if you have 5 Snakes in play (this one included), copy the effect of one of your Snakes. */
  [ClanCardId.SnakeCopySnake]: {
    cost: { food: eggCost },
    effects: { [Effect.CopySnake]: withSnakes(5) }
  },

  /**
   * Effect: if you have 5 Snakes in play (this one included), draw 1 Military Victory token and resolve it, then
   * turn one of your Snakes back onto its Egg side.
   * The token is what the card is played for and the Egg is what it costs, so both are under the same condition:
   * a player who is not there yet gives up neither.
   */
  [ClanCardId.SnakeMilitaryVictoryAndFlipBack]: {
    cost: { food: eggCost },
    effects: { [Effect.MilitaryVictory]: withSnakes(5), [Effect.FlipSnakeToEgg]: withSnakes(5) }
  },

  /**
   * Effect: draw 1 card, you may play one of your cards on its Egg side for free, then turn one of your Snakes
   * back onto its Egg side.
   * "For free" is the whole price of an Egg taken off, which is what the discount is written as: a Snake card
   * costs {@link eggCost} and nothing else, so the same number says both things (see {@link Effect.PlayCard}).
   */
  [ClanCardId.SnakeDrawPlayCardAndFlipBack]: {
    cost: { food: eggCost },
    effects: { [Effect.Draw]: 1, [Effect.PlayCard]: eggCost, [Effect.FlipSnakeToEgg]: 1 }
  }
} satisfies Partial<Record<ClanCardId, ClanCardProperties>>

/**
 * The Eggs their owner has in play, which one card of the clan is paid in Food for. The Snake reading them is not
 * one of them: it has hatched, and hatching is what activates it (see {@link hatchCard}).
 */
function eggs(rules: Rules, player: number): number {
  return playedEggs(rules, player).length
}
