import { MaterialRules } from '@gamepark/rules-api'
import { Clan } from '../Clan'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { TileEffect, TileEffects } from '../material/TileEffect'
import { Memory } from './Memory'
import { RuleId } from './RuleId'

/**
 * What a Special activation tile is worth, which depends on the clan of the player activating it: their Victory
 * condition card reads "1 crystal = ...". The rules resolve it here, and the app reads the same tables to tell
 * what a square is about to give.
 */

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

/** The clan a player took, read off their Victory condition card, which is what marks a clan as taken. */
export const playerClan = (rules: Rules, player: number): Clan | undefined =>
  rules.material(MaterialType.VictoryConditionCard).player(player).getItem<Clan>()?.id

/** What a special activation gives, which is anything a tile can give but another special activation. */
export type SpecialActivationEffects = Omit<TileEffects, TileEffect.SpecialActivation>

/**
 * The clans whose special activation gives something on its own: the Cats draw a card, the Sharks gain 2 military
 * symbols. Written in the effects a tile gives, so that the activation resolves them with the code it already has.
 */
export const specialActivationEffects: Partial<Record<Clan, SpecialActivationEffects>> = {
  [Clan.Cat]: { [TileEffect.Draw]: 1 },
  [Clan.Shark]: { [TileEffect.Military]: 2 }
}

/**
 * The clans whose special activation asks the player something, and the rule that offers it: the Scorpions Spy,
 * the Pandas pick between Food and Awakening.
 */
export const specialActivationChoices: Partial<Record<Clan, RuleId>> = {
  [Clan.Panda]: RuleId.PandaSpecialActivation,
  [Clan.Scorpion]: RuleId.Spy
}

/** What the Pandas pick between when they resolve their special activation. */
export enum PandaSpecialActivation {
  /** Gain 1 Food, exactly like a Food tile. */
  Food = 1,

  /** Gain 1 Awakening, which is only counted for now (see {@link Memory.Awakenings}). */
  Awakening
}

/** The Awakenings a player has gathered. Nothing spends them yet: the Panda material does not exist. */
export const awakenings = (rules: Rules, player: number): number => rules.game.memory[Memory.Awakenings]?.[player] ?? 0
