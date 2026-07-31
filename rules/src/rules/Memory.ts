export enum Memory {
  /** The {@link ActionZone} the active player picked on the Action tile of the round. */
  ActionZone = 1,

  /** The active player of the round: the one who reveals the Action tile, picks the zone, and acts first. */
  RoundPlayer,

  /**
   * The squares of the zone each player has already activated this round, as {@link XYCoordinates}.
   * Kept per player rather than for the one activating, so that nothing has to be reset when the activation is
   * left and taken back up, which an Upgrade does (see {@link RuleId.UpgradeTile}).
   */
  ActivatedCells,

  /** The military symbols a player gathered during the activation, until the military conflict compares them. */
  MilitarySymbols
}
