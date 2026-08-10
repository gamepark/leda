import { LedaRules } from '@gamepark/leda/LedaRules'
import { playerClan } from '@gamepark/leda/rules/specialActivation'
import { militaryVictoryProgress, specialVictoryProgress } from '@gamepark/leda/rules/victory'
import { ScoringDescription, ScoringValue } from '@gamepark/react-game'
import MilitaryVictoryImage from '../images/icons/MilitaryVictory.png'
import { specialVictoryImages } from '../victoryProgress'
import { GameOverHeader } from './GameOverHeader'
import { RaceName, RaceProgress, VictoryRace } from './RaceCells'

/**
 * What the result popup shows under the sentence naming the winner: where each player stood on each of the 2
 * races when the game closed, in the same numbers their panel was showing them (see {@link PlayerPanels}).
 *
 * So the loser reads how close they were, and both read the race that is not the one that ended the game. A column
 * per player and no total: the 2 races are not counted in the same thing, and LEDA has no score to add up.
 */
export class LedaScoring implements ScoringDescription<number, LedaRules, VictoryRace> {
  /** The clan first, then the military victory, which is the order the panels read them in. */
  getScoringKeys(): VictoryRace[] {
    return ['clan', 'military']
  }

  getScoringHeader(key: VictoryRace): ScoringValue {
    return <RaceName race={key} />
  }

  /** Nothing to show for a player who has no clan yet, which is only true of a game abandoned during the setup. */
  getScoringPlayerData(key: VictoryRace, player: number, rules: LedaRules): ScoringValue | null {
    const clan = playerClan(rules, player)
    const progress = key === 'clan' ? specialVictoryProgress(rules, player) : militaryVictoryProgress(rules, player)
    if (clan === undefined || progress === undefined) return null
    return <RaceProgress image={key === 'clan' ? specialVictoryImages[clan] : MilitaryVictoryImage} progress={progress} />
  }

  ResultHeader = GameOverHeader
}
