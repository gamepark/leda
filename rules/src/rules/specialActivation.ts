import { Clan } from '../Clan'
import { Effect, EffectSet } from '../material/Effect'
import { MaterialType } from '../material/MaterialType'
import { Rules } from '../Rules'
import { Memory } from './Memory'

/**
 * What a Special activation square is worth, which depends on the clan of the player activating it: their Victory
 * condition card reads "1 crystal = ...". Written in the lexicon every other effect is written in, so that the
 * same engine resolves them (see {@link resolveEffects}), and the app reads the same table to tell what a square
 * is about to give.
 */

/** The clan a player took, read off their Victory condition card, which is what marks a clan as taken. */
export const playerClan = (rules: Rules, player: number): Clan | undefined =>
  rules.material(MaterialType.VictoryConditionCard).player(player).getItem<Clan>()?.id

/**
 * The Pandas are the only clan whose crystal is a choice: 1 Food or 1 Awakening, the Awakening being written down
 * and resolved once their whole zone is activated (see {@link AwakeningRule}).
 */
export const specialActivationEffects: Record<Clan, EffectSet> = {
  [Clan.Panda]: { or: [{ [Effect.Food]: 1 }, { [Effect.Awakening]: 1 }] },
  [Clan.Shark]: { [Effect.Military]: 2 },
  [Clan.Cat]: { [Effect.Draw]: 1 },
  [Clan.Scorpion]: { [Effect.Spy]: 1 }
}

/** The Awakenings a player has gathered and not resolved yet (see {@link Memory.Awakenings}). */
export const awakenings = (rules: Rules, player: number): number => rules.game.memory[Memory.Awakenings]?.[player] ?? 0
