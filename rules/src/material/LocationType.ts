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
   * The Food reserve near the play area. No item ever goes here: the reserve is not modelled
   * (see {@link MaterialType.FoodToken}). The app displays a fixed pile of Food there, and Food that a player
   * gains or spends is animated from and to this location.
   */
  FoodSupply,

  /**
   * A player's 4x4 grid, addressed by x and y in 0..3. Holds the 16 tiles of that player, and nothing else:
   * what is played onto a square sits on the tile of the square rather than on the square (see {@link PlayedCard}),
   * which is what lets the organisation swap 2 squares by moving the 2 tiles alone.
   * Shark "Pack" adjacency is read straight off x and y.
   */
  PlayerGrid,

  /**
   * A clan card played onto a square of a player's grid, on the tile of that square: face up, whatever the tile
   * shows, and covering whatever was played there before.
   * Its parent is the tile item, not the square, so that a card follows its tile when 2 squares are swapped: on
   * the table it is dragged along with it, and in the game state it simply never moves.
   */
  PlayedCard,

  /**
   * A Shark token placed on a square of a player's grid, on the tile of that square like a card is, so that it
   * follows it when 2 squares are swapped.
   * Its x is the slot it covers on the Shark card underneath, which is what says whether that card gives its
   * normal effect or its Pack one (see {@link SharkSlot}).
   */
  PlacedSharkToken,

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
  PlayerSharkSupply,

  /**
   * The item a player took off the top of a pile with a Spy effect, to look at it before putting it back.
   * Never holds more than one item, and only for as long as the player takes to decide. Its owner sees its face,
   * and nobody else does, which is what makes the look a secret one.
   */
  SpiedItem,

  /**
   * One of the zones of 4 squares the Action tile of the round offers, over the grid of a player: the rectangle
   * the app draws around those squares while the active player picks the zone both of them will activate
   * (see {@link ActionZone}). Its id is the zone, and its player the grid it is drawn over.
   * Display only, like {@link FoodSupply}: no item is ever placed here, and the rules never read it.
   */
  ActionZoneArea
}
