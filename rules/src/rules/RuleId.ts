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

  /**
   * Still phase 3: the organisation of a player is over. Their opponent organises their own grid, and once both
   * have, the round ends.
   * A step of its own because what ends an organisation is not always the last thing its player does: one of the
   * 3 Cat cards paid with cards from the hand is paid for after it has been played, and what follows a payment
   * has to be a step that can be waited for (see {@link Memory.NextRules}).
   */
  EndOfOrganisation,

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

  /** The player pays for the card they have just played, with cards of their hand put under their deck. */
  PayCardCost,

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

  /** The player activates the effect reminded on one of their Deserts, which stays a Desert. */
  ActivateDesert,

  /** The player upgrades one of their tiles, and that same tile is then activated if it can be. */
  UpgradeAndActivateTile,

  /**
   * The player turns one of their own tiles onto its worse face: the Desert of a temporary tile, the non upgraded
   * front of a permanent one.
   * Named for what the player does and not for the card that asks it, like every other rule here: what opens it is
   * a Scorpion Portal read as "your opponent flips one of their tiles", and the player answering it is that
   * opponent (see {@link Effect.FlipOpponentTile}). It is the one rule of the game a player opens for somebody
   * else to answer, hence the player it hands the game back to being remembered (see {@link Memory.EffectPlayer}).
   */
  DowngradeTile,

  /** The player swaps 2 squares of their grid, with whatever is played on them. */
  SwapSquares,

  /** The player activates one of their tiles, on the face it is showing, and nothing else happens to it. */
  ActivateTile,

  /** The player copies one of the cards their opponent has in the zone of the round. */
  CopyOpponentCard,

  /** The player takes a Ring out of their deck and into their hand, then shuffles their deck. */
  SearchRing,

  /** The player may put a Ring from their hand under their deck, to draw a Military Victory token instead. */
  SpendRingForToken,

  /** The player may turn one of their Cat cards in play onto its other effect. */
  RotateCatCard,

  /**
   * The Awakenings a player of the Pandas gathered while activating, resolved once their whole zone is done: each
   * of them raises a Panda of the grid to the level above.
   * A step of phase 1 for that clan alone, hence its place down here rather than after the activation it follows:
   * what a clan does on its own has no business in the flow every game goes through.
   */
  Awakening
}
