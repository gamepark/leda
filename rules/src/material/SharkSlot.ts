/**
 * The 2 slots of the effect area printed at the bottom of a Shark card: the normal effect on the left, the Pack
 * effect on the right.
 *
 * A Shark token sits on one of them and covers it, so what the card gives is the effect of the other slot. A token
 * sits on the right while the Pack of its square sleeps, and on the left once it wakes up.
 *
 * Which one it is is never part of the state of a token: it is read off the squares around it, every time
 * (see {@link sharkSlotOn}).
 */
export enum SharkSlot {
  Left = 1,
  Right
}
