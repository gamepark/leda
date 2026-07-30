export enum MaterialType {
  /**
   * The 16 tiles forming a player's 4x4 grid, double sided.
   * 8 permanent tiles, which flip to an upgraded face, and 8 temporary ones, which flip to a Desert.
   * Both players use the same 16 tiles: on the physical game a triangle or a circle tells the two sets
   * apart, but one image per tile is enough here since the grid already belongs to a player.
   */
  Tile = 1,

  /** The 5 Action tiles shared by both players, revealed one per round to designate the zone to activate. */
  ActionTile,

  /** The clan cards: 13 for the Cats, 11 for each other clan. Drawn to hand, then played onto the grid. */
  ClanCard,

  /** One per clan, kept face up beside its owner's grid. Never shown face down, hence no back image. */
  VictoryConditionCard,

  /** The 18 Military Victory tokens, won by taking the upper hand during the military conflict. */
  MilitaryVictoryToken,

  /**
   * The main resource, spent to play clan cards. The box holds 20 of them, but the rules never say what happens
   * once the supply is empty, so the supply is not modelled: gaining Food creates items, spending it deletes them.
   * Food only ever exists in {@link LocationType.PlayerFood}.
   */
  FoodToken,

  /** The 9 Shark tokens, only in play if a player took the Shark clan. Placing the last one wins the game. */
  SharkToken
}
