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

  /**
   * Phase 3 of a round, the organisation: both players organise their grid, the active player of the round first.
   * A step of its own because the conflict may hand the game over to whoever won the token, who is not always the
   * player who organises first: this rule has no player, and starts the turn of the one who does.
   */
  StartOrganisation,

  /**
   * Still phase 3: a player plays one clan card from their hand onto a square of their grid, or swaps 2 of their
   * squares and gains 1 Food for having done so.
   */
  Organisation,

  /** The round is over: the player who was not the active one becomes the active player. */
  EndOfRound,

  /**
   * The rules below are not steps every round goes through, hence their place after them.
   * Most are opened by an effect to ask the player something, and hand the game back to whatever was in progress
   * (see {@link EffectRule}). Anything may open one: a tile that was activated, a Military Victory token, or a
   * clan card. The last ones belong to a single clan.
   */

  /** An Upgrade effect: the player turns one of their permanent tiles over, onto its upgraded side. */
  UpgradeTile,

  /** A Flip effect: the player turns one of their Deserts back onto its front, where it can be activated again. */
  FlipDesert,

  /** A Spy effect: the player looks at the top of a pile of their choice, then puts it back on top or under. */
  Spy,

  /** An "OR": the player picks which of the branches an effect offers is the one they resolve. */
  ChooseEffect,

  /** The player may play a clan card from their hand, at the discount the effect that offered it gives. */
  PlayCard,

  /** The player activates one of their clan cards in play, which gives whatever that card gives. */
  ActivateCard,

  /** The player activates one of their tiles, which is then upgraded if it can be. */
  ActivateAndUpgradeTile,

  /** The player draws the first Military Victory token and resolves it, conflict or not. */
  MilitaryVictory,

  /** The player puts one of the Military Victory tokens they own back under the pile, to draw another one. */
  RedrawMilitaryVictory,

  /** The player resolves the effect of one of the Military Victory tokens they own, all over again. */
  TriggerMilitaryVictory,

  /** The player places one of their Shark tokens on one of their tiles that has none. */
  PlaceSharkToken,

  /**
   * The Awakenings a player of the Pandas gathered while activating, resolved once their whole zone is done: each
   * of them raises a Panda of the grid to the level above.
   * A step of phase 1 for that clan alone, hence its place down here rather than after the activation it follows:
   * what a clan does on its own has no business in the flow every game goes through.
   */
  Awakening
}
