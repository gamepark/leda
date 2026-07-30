export enum LocationType {
  /**
   * The 5 Action tiles, face down between the players.
   * Once the 4th has been revealed, all 5 are shuffled back here.
   */
  ActionTileDeck = 1,

  /** Action tiles revealed since the last shuffle. They stay visible until the 4th one triggers a reshuffle. */
  ActionTileRevealed,

  /** The 18 Military Victory tokens, face down between the players. */
  MilitaryVictoryDeck,

  /**
   * A player's 4x4 grid, addressed by x and y in 0..3.
   * Holds the tiles and everything stacked on them: clan cards are played onto a tile (front or Desert
   * face, upgraded or not) or onto another clan card, and Shark tokens are placed on Shark cards.
   * Keeping a whole cell under one location is what makes the two rules that move things around work:
   * swapping two cells carries the cards along with their tile, and Shark "Pack" adjacency is read
   * straight off x and y.
   */
  PlayerGrid,

  /** A player's clan deck, face down beside the grid. */
  PlayerDeck,

  /** A player's hand of clan cards. */
  PlayerHand,

  /** The victory condition card of a player's clan, face up beside the grid. */
  PlayerVictoryCondition,

  /** The Military Victory tokens a player has won. Their symbols decide who becomes the active player. */
  PlayerMilitaryVictory,

  /**
   * The Food a player owns, the only place Food ever exists. There is no supply to take it from or return it to:
   * see {@link MaterialType.FoodToken}.
   */
  PlayerFood,

  /** The Shark tokens their owner has not placed on a card yet. */
  PlayerSharkSupply
}
