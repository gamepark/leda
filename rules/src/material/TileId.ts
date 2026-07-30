/**
 * The 16 base tiles a player arranges into their 4x4 grid during setup.
 *
 * Only 9 tiles are different: several are printed more than once, so each value below states how many copies
 * a player owns (8 permanent + 8 temporary = 16). Values follow the order the tiles appear on the punchboard.
 *
 * Every tile is double sided:
 * - a permanent tile is always activable, and an Upgrade effect flips it to a stronger version of its front;
 * - a temporary tile is flipped to its Desert side as soon as it is activated. A Desert has no effect of its own,
 *   until a Flip effect turns it back over. It still reminds its front effect in its bottom right corner, which is
 *   what the Scorpion cards that "activate the effect of one of your Deserts" read.
 */
export enum TileId {
  /** x1. Front: draw 1 card. Upgraded: draw 2 cards. */
  PermanentDraw = 1,
  /** x1. Front: 1 Special activation. Upgraded: 1 Special activation + 1 Food. */
  PermanentSpecialActivation,
  /** x4. Front: gain 1 Food. Upgraded: gain 2 Food. */
  PermanentFood,
  /** x2. Front: gain 1 Military. Upgraded: gain 2 Military. */
  PermanentMilitary,
  /** x4. Front: gain 1 Food, then flip to Desert. */
  TemporaryFood,
  /** x1. Front: draw 1 card, then flip to Desert. */
  TemporaryDraw,
  /** x1. Front: 1 Upgrade, then flip to Desert. */
  TemporaryUpgrade,
  /** x1. Front: 1 Special activation, then flip to Desert. */
  TemporarySpecialActivation,
  /** x1. Front: gain 1 Military, then flip to Desert. */
  TemporaryMilitary
}
