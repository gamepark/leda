export enum Memory {
  /** The {@link ActionZone} the active player picked on the Action tile of the round. */
  ActionZone = 1,

  /** The active player of the round: the one who reveals the Action tile, picks the zone, and acts first. */
  RoundPlayer,

  /** The squares of the zone the player who is activating has already activated, as {@link XYCoordinates}. */
  ActivatedCells,

  /** The military symbols a player gathered during the activation, until the military conflict compares them. */
  MilitarySymbols
}
