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
  ActivateZone,

  /**
   * Phase 2 of a round: the player who gathered the most military symbols during the activation takes the top
   * Military Victory token, reveals it and resolves its effect. Nothing happens if the players are tied.
   */
  MilitaryConflict,

  /** The round is over: the player who was not the active one becomes the active player. */
  EndOfRound,

  /**
   * The rules below are not steps of a round: an effect opens one to ask the player something, and it hands the
   * game back to whatever was in progress (see {@link EffectRule}). Anything may open them: a tile that was
   * activated, a Military Victory token, or a clan card.
   */

  /** An Upgrade effect: the player turns one of their permanent tiles over, onto its upgraded side. */
  UpgradeTile,

  /** A Flip effect: the player turns one of their Deserts back onto its front, where it can be activated again. */
  FlipDesert
}
