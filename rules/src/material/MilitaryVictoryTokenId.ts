import { getEnumValues } from '@gamepark/rules-api'

/**
 * The 18 Military Victory tokens, shuffled face down between the players.
 *
 * The player who gained the most Military symbols during a round draws the top one and resolves its effect.
 * Only 8 tokens are different: each value below states how many copies are in the pile (3 + 2 + 2 + 2 + 3 + 2 + 2 + 2 = 18).
 *
 * Every token is worth at least 1 Victory symbol. Those symbols are what a player counts to win a military
 * victory, and the player who controls the fewest of them becomes the active player after a reshuffle of the
 * Action tiles. Values follow the order of the rulebook glossary.
 */
export enum MilitaryVictoryTokenId {
  /** x3. 1 Victory symbol. */
  Victory = 1,
  /** x2. 2 Victory symbols. */
  DoubleVictory,
  /** x2. 1 Victory symbol, and Spy. */
  Spy,
  /** x2. 1 Victory symbol, and flip one of your Deserts back to its front, if possible. */
  FlipDesert,
  /** x3. 1 Victory symbol, and upgrade one of your tiles. */
  Upgrade,
  /** x2. 1 Victory symbol, and gain 1 Food. */
  Food,
  /** x2. 1 Victory symbol, and steal 1 Food from your opponent. No effect if they have none. */
  StealFood,
  /** x2. 1 Victory symbol, and draw 1 card. */
  Draw
}

/** How many Victory symbols a token is worth: every token shows 1, and one of them shows 2. */
export const militaryVictorySymbols = (token: MilitaryVictoryTokenId): number => (token === MilitaryVictoryTokenId.DoubleVictory ? 2 : 1)

/** How many copies of each token are in the pile. */
const militaryVictoryTokenQuantities: Record<MilitaryVictoryTokenId, number> = {
  [MilitaryVictoryTokenId.Victory]: 3,
  [MilitaryVictoryTokenId.DoubleVictory]: 2,
  [MilitaryVictoryTokenId.Spy]: 2,
  [MilitaryVictoryTokenId.FlipDesert]: 2,
  [MilitaryVictoryTokenId.Upgrade]: 3,
  [MilitaryVictoryTokenId.Food]: 2,
  [MilitaryVictoryTokenId.StealFood]: 2,
  [MilitaryVictoryTokenId.Draw]: 2
}

/** The 18 Military Victory tokens, before they are shuffled. */
export const militaryVictoryTokens: MilitaryVictoryTokenId[] = getEnumValues(MilitaryVictoryTokenId).flatMap((token) =>
  Array.from({ length: militaryVictoryTokenQuantities[token] }, () => token)
)

