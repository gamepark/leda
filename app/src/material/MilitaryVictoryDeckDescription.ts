import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { LocationDescription } from '@gamepark/react-game'
import { MilitaryVictoryDeckHelp } from './MilitaryVictoryDeckHelp'
import { militaryVictoryToken } from './MilitaryVictoryTokenDescription'

/**
 * The pile of Military Victory tokens as a spot of the table. It draws nothing of its own: a pile is the tokens it
 * holds, and this spot is only here so that the pile can be clicked as a pile, whichever of its tokens the pointer
 * lands on (see {@link MilitaryVictoryDeckHelp}).
 * It is the size of a token so that its edges are the edges of the pile, and round like one.
 */
export class MilitaryVictoryDeckDescription extends LocationDescription<number, MaterialType, LocationType> {
  width = militaryVictoryToken.width
  height = militaryVictoryToken.height
  borderRadius = militaryVictoryToken.height / 2

  help = MilitaryVictoryDeckHelp
}
