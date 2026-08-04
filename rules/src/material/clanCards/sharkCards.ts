import { Rules } from '../../Rules'
import { adjacentSharkTokens } from '../../rules/sharkPack'
import { ownedMilitaryVictoryTokens } from '../../rules/militaryConflict'
import { ClanCardId } from '../ClanCardId'
import { Effect } from '../Effect'
import { ClanCardProperties } from './ClanCardProperties'

/**
 * The 11 cards of the Sharks, read off REGLES LEDA REQUINS.pdf.
 *
 * Each card has a normal effect and a Pack effect, the Pack one replacing the normal one while the card is
 * orthogonally adjacent to 2 Shark tokens (see {@link sharkPack}). The cards whose normal effect is nothing are
 * the cheap ones: they are worth playing only where the Pack can reach them.
 */

/** How many Military Victory tokens a player owns, which 2 of these cards are paid in Food for. */
const victoryTokens = (rules: Rules, player: number): number => ownedMilitaryVictoryTokens(rules, player).length

export const sharkCards = {
  /** Upgrade one of your tiles. Pack: activate one of your tiles, then upgrade it if possible. */
  [ClanCardId.SharkUpgrade]: {
    cost: { food: 6 },
    effects: { [Effect.Upgrade]: 1 },
    secondEffects: { [Effect.ActivateAndUpgradeTile]: 1 }
  },

  /** Spy. Pack: gain 1 Military and trigger the effect of one of your Military Victory tokens. */
  [ClanCardId.SharkSpyOrTriggerToken]: {
    cost: { food: 6 },
    effects: { [Effect.Spy]: 1 },
    secondEffects: { [Effect.Military]: 1, [Effect.TriggerMilitaryVictory]: 1 }
  },

  /** Nothing. Pack: put one of your Military Victory tokens back under the pile and draw a new one. */
  [ClanCardId.SharkPackRedrawToken]: {
    cost: { food: 3 },
    secondEffects: { [Effect.RedrawMilitaryVictory]: 1 }
  },

  /** Gain 1 Military. Pack: gain 2 Military. */
  [ClanCardId.SharkMilitary]: {
    cost: { food: 5 },
    effects: { [Effect.Military]: 1 },
    secondEffects: { [Effect.Military]: 2 }
  },

  /** Gain 1 Military. Pack: gain 1 Military and draw 1 card. */
  [ClanCardId.SharkMilitaryAndDraw]: {
    cost: { food: 4 },
    effects: { [Effect.Military]: 1 },
    secondEffects: { [Effect.Military]: 1, [Effect.Draw]: 1 }
  },

  /** Gain 2 Military. Pack: gain 1 Military per orthogonally adjacent Shark token. */
  [ClanCardId.SharkMilitaryPerToken]: {
    cost: { food: 7 },
    effects: { [Effect.Military]: 2 },
    secondEffects: { [Effect.Military]: (rules, player, cell) => (cell === undefined ? 0 : adjacentSharkTokens(rules, player, cell)) }
  },

  /** Nothing. Pack: draw 1 Military Victory token and resolve its effect. */
  [ClanCardId.SharkPackDrawToken]: {
    cost: { food: 7 },
    secondEffects: { [Effect.MilitaryVictory]: 1 }
  },

  /** Gain 1 Food. Pack: you may play a card from your hand, reducing its cost by 2 Food. */
  [ClanCardId.SharkFoodOrDiscount]: {
    cost: { food: 5 },
    effects: { [Effect.Food]: 1 },
    secondEffects: { [Effect.PlayCard]: 2 }
  },

  /** Gain 1 Food per pair of Military Victory tokens you own. Pack: gain 1 Food per token you own. */
  [ClanCardId.SharkFoodPerToken]: {
    cost: { food: 7 },
    effects: { [Effect.Food]: (rules, player) => Math.floor(victoryTokens(rules, player) / 2) },
    secondEffects: { [Effect.Food]: (rules, player) => victoryTokens(rules, player) }
  },

  /** Nothing. Pack: place a Shark token on one of your tiles that has none. */
  [ClanCardId.SharkPackPlaceToken]: {
    cost: { food: 3 },
    secondEffects: { [Effect.PlaceSharkToken]: 1 }
  },

  /** Nothing. Pack: Spy. */
  [ClanCardId.SharkPackSpy]: {
    cost: { food: 3 },
    secondEffects: { [Effect.Spy]: 1 }
  }
} satisfies Partial<Record<ClanCardId, ClanCardProperties>>
