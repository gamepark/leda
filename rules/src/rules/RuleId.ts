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
  Mulligan
}
