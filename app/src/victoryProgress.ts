import { Clan } from '@gamepark/leda/Clan'
import { VictoryProgress } from '@gamepark/leda/rules/victory'
import CatRingImage from './images/icons/CatRing.png'
import PandaGoldImage from './images/icons/PandaGold.png'
import ScorpionPortalImage from './images/icons/ScorpionPortal.png'
import SharkImage from './images/icons/Shark.png'

/**
 * How the 2 races a player runs are shown, wherever they are shown: on their panel for as long as the game lasts,
 * and in the result popup once it is over (see {@link PlayerPanels}, {@link LedaScoring}).
 */

/** A race is 2 numbers: how far a player is and how far they have to go, both read off the rules. */
export const race = ({ count, goal }: VictoryProgress) => `${count}/${goal}`

/**
 * What each clan gathers towards its own victory, as the symbol its Victory condition card prints next to the
 * number of them it takes: the Gold Pandas, the Shark tokens, the Rings, the Portals in the corners.
 */
export const specialVictoryImages: Record<Clan, string> = {
  [Clan.Panda]: PandaGoldImage,
  [Clan.Shark]: SharkImage,
  [Clan.Cat]: CatRingImage,
  [Clan.Scorpion]: ScorpionPortalImage
}
