export enum CustomMoveType {
  /** A player picks the clan they will play. The data of the move is the {@link Clan}. */
  ChooseClan = 1,

  /** A player is not happy with their starting hand and puts it back into their deck to draw as many cards again. */
  Mulligan,

  /** A player keeps their starting hand, which ends their part of the setup. */
  KeepStartingHand,

  /** The active player picks one of the zones the revealed Action tile offers. The data is the {@link ActionZone}. */
  ChooseAction,

  /** A player activates one square of the zone in their grid. The data is its {@link XYCoordinates}. */
  ActivateSquare,

  /**
   * A player resolves an "OR" effect. The data is the index of the branch they picked, in the choice they are
   * being offered (see {@link EffectChoice}).
   */
  ChooseEffect,

  /** A player activates one of their clan cards in play. The data is the index of that card. */
  ActivateCard,

  /** A player turns down what an effect only lets them do: playing a card from their hand, so far. */
  Decline
}
