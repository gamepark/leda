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
  Pass,

  /**
   * A player turns one of their Cat cards half a turn, onto the other of the 2 effects it prints. The data is the
   * {@link XYCoordinates} of its square, like every other card the player designates.
   * Told apart from activating a square because it is the opposite: the card is turned without being activated,
   * where an activation turns it as a consequence of what it gave (see {@link RotateCatCardRule}).
   */
  RotateCatCard,

  /**
   * A player takes a Ring out of their own deck. The data is the {@link ClanCardId} of that Ring, and not where it
   * is in the pile: a deck is shuffled and hidden from its owner too, so which card is where is the server's to
   * know. Which Rings are still in there is not a secret at all, being what is left once the ones in hand and in
   * play are counted out, so the player names the one they want (see {@link ringsInDeck}).
   */
  SearchRing
}
