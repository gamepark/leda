import { TileId } from './TileId'

/** What activating a tile gives. The lexicon of the rulebook names each of them. */
export enum TileEffect {
  /** Gain Food, the resource clan cards are paid with. */
  Food = 1,

  /** Draw: add the first card of your deck to your hand. */
  Draw,

  /** A military symbol, counted until the military conflict at the end of the round. */
  Military,

  /** Upgrade: flip one of your permanent tiles to its upgraded side. */
  Upgrade,

  /** The special activation of your clan, which its Victory condition card describes. */
  SpecialActivation
}

/** What one face of a tile gives, and how many times each effect applies. */
export type TileEffects = Partial<Record<TileEffect, number>>

/** The tiles an Upgrade effect can flip. The others are temporary: activating one turns it into a Desert. */
const permanentTiles = [TileId.PermanentDraw, TileId.PermanentSpecialActivation, TileId.PermanentFood, TileId.PermanentMilitary]

export const isPermanent = (tile: TileId): boolean => permanentTiles.includes(tile)

/** What a tile gives when it is activated on its front. */
const frontEffects: Record<TileId, TileEffects> = {
  [TileId.PermanentDraw]: { [TileEffect.Draw]: 1 },
  [TileId.PermanentSpecialActivation]: { [TileEffect.SpecialActivation]: 1 },
  [TileId.PermanentFood]: { [TileEffect.Food]: 1 },
  [TileId.PermanentMilitary]: { [TileEffect.Military]: 1 },
  [TileId.TemporaryFood]: { [TileEffect.Food]: 1 },
  [TileId.TemporaryDraw]: { [TileEffect.Draw]: 1 },
  [TileId.TemporaryUpgrade]: { [TileEffect.Upgrade]: 1 },
  [TileId.TemporarySpecialActivation]: { [TileEffect.SpecialActivation]: 1 },
  [TileId.TemporaryMilitary]: { [TileEffect.Military]: 1 }
}

/** What an upgraded permanent tile gives. A temporary tile has no such face: its back is a Desert. */
const upgradedEffects: Partial<Record<TileId, TileEffects>> = {
  [TileId.PermanentDraw]: { [TileEffect.Draw]: 2 },
  [TileId.PermanentSpecialActivation]: { [TileEffect.SpecialActivation]: 1, [TileEffect.Food]: 1 },
  [TileId.PermanentFood]: { [TileEffect.Food]: 2 },
  [TileId.PermanentMilitary]: { [TileEffect.Military]: 2 }
}

/**
 * What activating a tile gives on the face it currently shows. `flipped` is the rotation of the tile: the upgraded
 * face of a permanent tile, the Desert of a temporary one. A Desert has no effect, hence the empty record.
 */
export const tileEffects = (tile: TileId, flipped: boolean): TileEffects => (flipped ? (upgradedEffects[tile] ?? {}) : frontEffects[tile])

export const hasTileEffect = (tile: TileId, flipped: boolean): boolean => Object.keys(tileEffects(tile, flipped)).length > 0
