import { RoundPhase } from '@gamepark/leda/rules/roundPhase'
import Phase1Image from './images/help/round-phase-1.jpg'
import Phase2Image from './images/help/round-phase-2.jpg'
import Phase3Image from './images/help/round-phase-3.jpg'

/**
 * The player aid card of the box, cut into the 3 lines it prints, one per phase of a round.
 *
 * The line of the phase the round is in opens the middle column of the table, and the 3 of them are stacked back
 * into the card in the help that line opens: they are cut where the card draws its rules, so nothing of it is lost
 * between 2 of them (see {@link RoundPhaseButton} and {@link RoundPhaseDialog}).
 */
export const roundPhaseImages: Record<RoundPhase, string> = {
  [RoundPhase.Activation]: Phase1Image,
  [RoundPhase.MilitaryConflict]: Phase2Image,
  [RoundPhase.Organisation]: Phase3Image
}

/**
 * The shape of the tallest of the 3 lines, which is the first one, in the 700 pixels wide the images are cut at.
 * The 3 lines are not the same height, so it is that one the table reserves the room for: what stands under it in
 * the middle column would move at every change of phase otherwise (see {@link roundPhaseCard}).
 */
export const roundPhaseLineRatio = 700 / 256
