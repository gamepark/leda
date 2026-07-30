import { Clan } from '@gamepark/leda/Clan'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { CardDescription } from '@gamepark/react-game'
import CatVictoryCondition from '../images/cards/cat/victory-condition.jpg'
import ScorpionVictoryCondition from '../images/cards/scorpion/victory-condition.jpg'
import SharkVictoryCondition from '../images/cards/shark/victory-condition.jpg'
import { tileSize } from './TileDescription'

/**
 * The Victory condition card of a clan, kept face up beside its owner's grid. Its id is the {@link Clan} itself.
 * It has no back here: it is never shown face down. Its back, the emblem of the clan, is what illustrates the clan
 * in the choice dialog, where it is used directly (see clanBacks in ClanCardDescription).
 */
export class VictoryConditionCardDescription extends CardDescription<number, MaterialType, LocationType, Clan> {
  width = tileSize
  height = tileSize
  borderRadius = 0.5

  /** The Pandas are missing: they have no card image yet, and playableClans keeps them out of the choice. */
  images = {
    [Clan.Cat]: CatVictoryCondition,
    [Clan.Shark]: SharkVictoryCondition,
    [Clan.Scorpion]: ScorpionVictoryCondition
  } as Record<Clan, string>
}
