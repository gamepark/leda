export enum CustomMoveType {
  /** A player picks the clan they will play. The data of the move is the {@link Clan}. */
  ChooseClan = 1,

  /** A player is not happy with their starting hand and puts it back into their deck to draw as many cards again. */
  Mulligan,

  /** A player keeps their starting hand, which ends their part of the setup. */
  KeepStartingHand
}
