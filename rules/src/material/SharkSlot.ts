/**
 * The 2 slots of the effect area printed at the bottom of a Shark card: the normal effect on the left, the Pack
 * effect on the right.
 *
 * A Shark token sits on one of them and covers it, so what the card gives is the effect of the other slot. A card
 * played takes its token on the right, over the Pack effect it cannot use yet; the token moves to the left, and
 * back, as the Pack wakes up and falls asleep again (see {@link sharkPack}).
 *
 * The values are the x of the location of a placed token, and the app reads them as which half of the card to
 * draw it on.
 */
export enum SharkSlot {
  Left = 1,
  Right
}
