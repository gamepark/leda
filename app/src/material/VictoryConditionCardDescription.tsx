import { Clan } from '@gamepark/leda/Clan'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialItem } from '@gamepark/rules-api'
import CatVictoryCondition from '../images/cards/cat/victory-condition.jpg'
import PandaVictoryCondition from '../images/cards/panda/victory-condition.jpg'
import ScorpionVictoryCondition from '../images/cards/scorpion/victory-condition.jpg'
import SharkVictoryCondition from '../images/cards/shark/victory-condition.jpg'
import { AwakeningButtons } from './AwakeningButtons'
import { LedaCardDescription } from './LedaCardDescription'
import { tileSize } from './TileDescription'
import { VictoryConditionCardHelp } from './VictoryConditionCardHelp'

/**
 * The Victory condition card of a clan, kept face up beside its owner's grid. Its id is the {@link Clan} itself.
 * It has no back here: it is never shown face down. Its back, the emblem of the clan, is what illustrates the clan
 * in the choice dialog, where it is used directly (see clanBacks in ClanCardDescription).
 */
export class VictoryConditionCardDescription extends LedaCardDescription<Clan> {
  width = tileSize
  height = tileSize
  borderRadius = 0.5

  images: Record<Clan, string> = {
    [Clan.Panda]: PandaVictoryCondition,
    [Clan.Shark]: SharkVictoryCondition,
    [Clan.Cat]: CatVictoryCondition,
    [Clan.Scorpion]: ScorpionVictoryCondition
  }

  /** Clicking the card opens the 2 races of the clan and what its crystal is worth (see {@link VictoryConditionCardHelp}). */
  help = VictoryConditionCardHelp

  /**
   * The card carries the Awakenings of its owner, hanging under it, which is where a player reads what their clan
   * still owes them. Only the Pandas ever gather any, and the buttons decide on their own whether to show, so the
   * menu is always mounted (see {@link AwakeningButtons}).
   */
  menuAlwaysVisible = true

  getItemMenu(item: MaterialItem<number, LocationType, Clan>) {
    if (item.location.player === undefined) return
    return <AwakeningButtons player={item.location.player} />
  }
}
