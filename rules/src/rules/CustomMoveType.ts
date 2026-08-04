export enum CustomMoveType {
  /** A player picks the clan they will play. The data of the move is the {@link Clan}. */
  ChooseClan = 1,

  /** A player is not happy with their starting hand and puts it back into their deck to draw as many cards again. */
  Mulligan,

  /** The active player picks one of the zones the revealed Action tile offers. The data is the {@link ActionZone}. */
  ChooseAction,

  /**
   * A player designates one square of their grid to activate. The data is its {@link XYCoordinates}.
   *
   * What is activated on it is what the rule asking says, the rulebook naming 3 things where the player only ever
   * does one: the squares of the zone resolve what stands on them, card or tile ({@link ActivateZoneRule}), while
   * a card may ask for the card of a square ({@link ActivateCardRule}) or for its tile
   * ({@link ActivateAndUpgradeTileRule}).
   */
  ActivateSquare,

  /**
   * A player resolves an "OR" effect. The data is the index of the branch they picked, in the choice they are
   * being offered (see {@link EffectChoice}).
   */
  ChooseEffect,

  /** A player resolves again the effect of a Military Victory token they own. The data is its index. */
  TriggerMilitaryVictory,

  /**
   * A player passes on what they are only allowed to do, rather than told to: keeping the hand they drew instead
   * of shuffling it back, or turning down the card an effect lets them play.
   * The data is the player, for the rules where several may pass at the same time.
   */
  Pass
}
