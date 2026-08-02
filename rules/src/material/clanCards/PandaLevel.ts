/**
 * The level printed in the corner of a Panda card, which is what an Awakening reads.
 *
 * An Awakening takes a Panda of one level off the grid, back into the hand of its owner, and puts one of the next
 * level in its place. So the values are consecutive on purpose: awakening a Panda is going from one to the next,
 * and a Gold one is the end of the line.
 *
 * A Panda is never bought at its own level: only the Bronze ones are played during the organisation, and Silver
 * and Gold ones only ever reach the grid through an Awakening (see {@link pandaCards}).
 */
export enum PandaLevel {
  Bronze = 1,
  Silver,
  Gold
}
