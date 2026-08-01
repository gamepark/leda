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
  MilitarySymbols,

  /**
   * Where to go once an effect that asks the player to choose is resolved: the rule that was interrupted, or what
   * comes after the one that opened the choice. Set by whoever opens such a rule, and forgotten as soon as that
   * rule hands over (see {@link EffectRule}), so that it holds a rule only while one is actually waiting.
   */
  NextRule,

  /**
   * The Awakenings a player gathered with the special activation of the Pandas, as a count.
   * TODO: nothing spends them yet, since the Panda cards do not exist (see {@link ClanCardId}). Only the counter
   * is kept for now, and it is never reset: an Awakening is not lost at the end of a round, unlike the military
   * symbols above.
   */
  Awakenings
}
