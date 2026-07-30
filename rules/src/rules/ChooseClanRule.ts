import { PlayerTurnRule } from '@gamepark/rules-api'

export class ChooseClanRule extends PlayerTurnRule {
  getPlayerMoves() {
    // TODO: pick a clan, create its material, draw 3 cards and gain 1 Food, then let the other player pick.
    return []
  }
}
