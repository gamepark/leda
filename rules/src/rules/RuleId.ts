export enum RuleId {
  /**
   * Setup step 6: in turn order, each player picks a clan, takes its Victory condition card, shuffles its cards
   * into a deck, takes the extra material of that clan, then draws 3 cards and gains 1 Food.
   * None of that material exists when the game starts: it is created here, once a clan has been picked.
   */
  ChooseClan = 1,

  /**
   * Still setup step 6: a player who is not happy with the cards they just drew may, once only, shuffle them back
   * into their deck and draw as many again. Then it is their opponent's turn to pick a clan.
   */
  Mulligan,

  /**
   * Phase 1 of a round: the active player reveals the top Action tile, then picks one of the zones of 4 squares
   * it offers. Both players will then activate that zone of their own grid.
   */
  ChooseAction,

  /**
   * Still phase 1: a player activates every square of the chosen zone in their own grid, if possible and in the
   * order of their choice. The active player of the round goes first, then their opponent does the same.
   */
  ActivateZone
}
