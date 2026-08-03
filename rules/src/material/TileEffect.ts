import { Effect, Effects, hasEffect } from './Effect'
import { TileId } from './TileId'

/** What each tile gives, on each of its 2 faces, in the lexicon every effect of the game is written in. */

/** The tiles an Upgrade effect can flip. The others are temporary: activating one turns it into a Desert. */
const permanentTiles = [TileId.PermanentDraw, TileId.PermanentSpecialActivation, TileId.PermanentFood, TileId.PermanentMilitary]

export const isPermanent = (tile: TileId): boolean => permanentTiles.includes(tile)

/** What a tile gives when it is activated on its front. */
const frontEffects: Record<TileId, Effects> = {
  [TileId.PermanentDraw]: { [Effect.Draw]: 1 },
  [TileId.PermanentSpecialActivation]: { [Effect.SpecialActivation]: 1 },
  [TileId.PermanentFood]: { [Effect.Food]: 1 },
  [TileId.PermanentMilitary]: { [Effect.Military]: 1 },
  [TileId.TemporaryFood]: { [Effect.Food]: 1 },
  [TileId.TemporaryDraw]: { [Effect.Draw]: 1 },
  [TileId.TemporaryUpgrade]: { [Effect.Upgrade]: 1 },
  [TileId.TemporarySpecialActivation]: { [Effect.SpecialActivation]: 1 },
  [TileId.TemporaryMilitary]: { [Effect.Military]: 1 }
}

/** What an upgraded permanent tile gives. A temporary tile has no such face: its back is a Desert. */
const upgradedEffects: Partial<Record<TileId, Effects>> = {
  [TileId.PermanentDraw]: { [Effect.Draw]: 2 },
  [TileId.PermanentSpecialActivation]: { [Effect.SpecialActivation]: 1, [Effect.Food]: 1 },
  [TileId.PermanentFood]: { [Effect.Food]: 2 },
  [TileId.PermanentMilitary]: { [Effect.Military]: 2 }
}

/**
 * What activating a tile gives on the face it currently shows. `flipped` is the rotation of the tile: the upgraded
 * face of a permanent tile, the Desert of a temporary one. A Desert has no effect, hence the empty record.
 */
export const tileEffects = (tile: TileId, flipped: boolean): Effects => (flipped ? (upgradedEffects[tile] ?? {}) : frontEffects[tile])

export const hasTileEffect = (tile: TileId, flipped: boolean): boolean => hasEffect(tileEffects(tile, flipped))
