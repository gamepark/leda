import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { MaterialDescription } from '@gamepark/react-game'
import { ActionTileDescription } from './ActionTileDescription'
import { ClanCardDescription } from './ClanCardDescription'
import { FoodTokenDescription } from './FoodTokenDescription'
import { MilitaryVictoryTokenDescription } from './MilitaryVictoryTokenDescription'
import { SharkTokenDescription } from './SharkTokenDescription'
import { TileDescription } from './TileDescription'
import { VictoryConditionCardDescription } from './VictoryConditionCardDescription'

export const Material: Partial<Record<MaterialType, MaterialDescription<number, MaterialType, LocationType>>> = {
  [MaterialType.Tile]: new TileDescription(),
  [MaterialType.ActionTile]: new ActionTileDescription(),
  [MaterialType.ClanCard]: new ClanCardDescription(),
  [MaterialType.VictoryConditionCard]: new VictoryConditionCardDescription(),
  [MaterialType.MilitaryVictoryToken]: new MilitaryVictoryTokenDescription(),
  [MaterialType.FoodToken]: new FoodTokenDescription(),
  [MaterialType.SharkToken]: new SharkTokenDescription()
}
