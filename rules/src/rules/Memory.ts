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
  Awakenings,

  /**
   * The Spies that have to land on different piles, as the number of them still bound to each other and the piles
   * they have already used (see {@link Effect.SpyDifferentPiles}).
   * Counted down rather than read off the rules waiting, so that a Spy gathered from anywhere else in the same
   * activation is not caught by the constraint of a Scorpion Portal.
   */
  SpyDifferentPiles,

  /**
   * Whose effect an opponent is being asked to answer, so that the game goes back to them once it is answered
   * (see {@link DowngradeTileRule}). Every other rule an effect opens is answered by the player it belongs to,
   * and hands the game over without ever having to name anyone.
   */
  EffectPlayer,

  /**
   * Set by a Scorpion Portal for the rest of the round: no player may win a Military Victory token, neither by
   * winning the military conflict nor through a card that draws one. Emptied when the next round starts.
   */
  MilitaryVictoryBlocked,

  /**
   * The Spies of the round: who looked into which pile, and whether they put the item back on top of it or under
   * it (see {@link Spy}). Emptied when the next round starts, like the counters above it.
   *
   * Nothing secret is written here: around a table everyone sees which pile a player takes an item from and which
   * end of it they slide it back into, and only the face of that item is theirs alone. This is that much, kept for
   * the round it belongs to, so that a player who was watching something else can read it back
   * (see {@link SpyHistoryDialog}).
   */
  Spies,

  /**
   * How many cards the player who has just played one of the 3 Cat cards paid with cards still owes for it, as a
   * count going down to nothing (see {@link PayCardCostRule}).
   * Written down when the card is played rather than read off it: what has already been paid would otherwise have
   * to be counted against a card that is by then one of several on its square.
   */
  CardsOwed,

  /**
   * What is left of the effects of a square once one of them has asked the player something, in the order the
   * card writes them (see {@link PendingEffects}). The set being resolved is the first, and it is forgotten as
   * soon as it is, exactly like a choice.
   * Written down rather than given ahead of the question, because the answer is what the rest of the card lands
   * on: the card drawn by "Spy, then draw 1 card" is whichever card the Spy leaves on top of the deck.
   */
  PendingEffects,

  /**
   * The swaps made while organising this round: whose grid, and the 2 squares that changed places
   * (see {@link OrganisationSwap}). Emptied when the next round starts, like the Spies above.
   *
   * Only the swaps of an organisation, and not the ones a Scorpion Portal offers: a player organises while their
   * opponent is watching their own grid being handed back to them, which is exactly when 2 squares changing
   * places goes unnoticed. A Portal is played in the middle of an activation everyone is already watching.
   */
  OrganisationSwaps,

  /**
   * Everything already activated this round, as the items themselves rather than the squares they were standing
   * on (see {@link EffectItem}): the FAQ of the game forbids activating the same tile or the same clan card twice
   * during one activation phase, whichever effect asks for it.
   *
   * The items and not their squares, which is the whole point of writing this down beside {@link ActivatedCells}:
   * a Scorpion Portal swaps 2 squares in the middle of the phase, and a tile carried onto a square nobody has
   * activated yet is still a tile that has given what it gives (see {@link SwapSquaresRule}).
   *
   * One list for the table rather than one per player, an index naming an item of the game and not of a grid.
   * Emptied when the next round starts, like the counters and the swaps above.
   */
  ActivatedItems
}
