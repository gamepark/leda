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
   * The rules waiting to be played, in the order they will be: what the effects of a square asked the player,
   * then whatever was interrupted to ask it. Every rule that asks something hands over to the first of them once
   * it is done, and takes it off the list (see {@link EffectRule} and {@link startNextRule}).
   * A list rather than a single rule, because one card may ask several things: "Spy. You may then play a card".
   */
  NextRules,

  /**
   * The choices an effect left the player, in the order they will be made (see {@link EffectChoice}). The one
   * being made is the first, and it is forgotten as soon as it is.
   */
  EffectChoices,

  /** The Food the card an effect lets a player play is discounted by (see {@link Effect.PlayCard}). */
  CardDiscount,

  /**
   * The Awakenings a player gathered with the special activation of the Pandas and has not resolved yet, as a
   * count. Nothing stands for one on the table: like a military symbol, it is only counted.
   * It goes back down to 0 within the round that raised it, since every Awakening is resolved as soon as its
   * owner is done activating their zone (see {@link AwakeningRule}).
   */
  Awakenings
}
