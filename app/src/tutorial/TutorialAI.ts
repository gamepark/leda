import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { RuleId } from '@gamepark/leda/rules/RuleId'
import { MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { sample } from 'es-toolkit'
import { Ai, aiPlayer } from './ai/AiPlayer'
import {
  activateCard,
  activateDesert,
  activateTile,
  awaken,
  chooseEffect,
  copyOpponentCard,
  downgradeTile,
  flipDesert,
  payCardCost,
  placeRing,
  placeSharkToken,
  playCardEffect,
  redrawMilitaryVictory,
  rotateCatCard,
  searchRing,
  spendRingForToken,
  swapSquares,
  triggerMilitaryVictory,
  upgradeTile
} from './ai/effects'
import { militaryNeed } from './ai/grid'
import { activateZone, chooseAction, chooseClan, mulligan, organise } from './ai/phases'
import { chooseSpiedPile, isPuttingSpiedItemBack, putSpiedItemBack } from './ai/spy'

type Game = MaterialGame<number, MaterialType, LocationType>
type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The opponent of the tutorial, and of anyone playing LEDA against the machine.
 *
 * It plays the game the way the game is written: everything a tile, a card or a Military Victory token gives is a
 * set of effects in one lexicon (see {@link Effect}), so the AI prices that lexicon once and reads all 46 cards
 * of the box through it (see {@link AiPlayer}). What is left on top of that is what the game asks a player to
 * think about, and each of those is a function of its own:
 *
 * - the zone of the round is picked on the gap between the 2 grids, not on what it gives here (see {@link chooseAction});
 * - the military symbols are worth the conflict they win, so beating the opponent by 1 is where they stop being
 *   worth anything (see {@link militaryScore});
 * - a square that upgrades a tile is activated while there is still a square of the zone to land the upgrade on
 *   (see {@link activateZone});
 * - a card played is a square of the grid for the rest of the game, which is why it comes before a swap and
 *   before the Food (see {@link organise});
 * - and a swap sends the good squares where the Action tiles still in the pile are likely to point
 *   (see {@link swapValue}).
 *
 * The clans are not 4 sets of special cases: each of them bends what its Victory condition card asks for, and the
 * rest follows. The Sharks pay for the Packs their tokens wake up, the Pandas for their Awakenings, the Cats for
 * their draws and their Rings, the Scorpions for their Food and their Portals in the corners.
 *
 * On what it is allowed to know: this runs on a client that holds the whole state of the game, hidden material
 * included, so nothing but its own discipline stops it from reading the hand of its opponent or the order of a
 * face down pile. It reads neither. What it knows of a pile is what a Spy effect showed it, which is the effect
 * doing its job (see {@link spy}), and everything else it reads is on the table for both players to see.
 */
export const ai = (game: Game, player: number): Promise<Move[]> => {
  const move = aiMove(game, player)
  return Promise.resolve(move === undefined ? [] : [move])
}

/**
 * The same opponent, answered on the spot: what the scripted part of the tutorial plays for them, where the
 * framework would otherwise pick one of their legal moves at random (see {@link LedaTutorial.getNextMove}).
 * Everything it decides is decided here anyway - the promise above is only the shape the framework asks for.
 */
export const aiMove = (game: Game, player: number): Move | undefined => {
  const rules = new LedaRules(game)
  const legalMoves = rules.getLegalMoves(player)
  if (legalMoves.length === 0) return undefined
  if (legalMoves.length === 1) return legalMoves[0]
  // What the opponent can still reach off their own side of the zone, which is what a military symbol is worth
  // this round: every decision below is priced against it (see {@link militaryScore}).
  const context = aiPlayer(rules, player, militaryNeed(rules, player))
  return decide(context, legalMoves) ?? sample(legalMoves)!
}

const decide = (ai: Ai, moves: Move[]): Move | undefined => {
  switch (ai.rules.game.rule?.id) {
    case RuleId.ChooseClan:
      return chooseClan(moves)
    case RuleId.Mulligan:
      return mulligan(ai, moves)
    case RuleId.ChooseAction:
      return chooseAction(ai, moves)
    case RuleId.ActivateZone:
      return activateZone(ai, moves)
    case RuleId.Organisation:
      return organise(ai, moves)
    case RuleId.UpgradeTile:
      return upgradeTile(ai, moves)
    // The tile picked here is the tile activated, on the face it shows once turned over.
    case RuleId.UpgradeAndActivateTile:
      return upgradeTile(ai, moves, true)
    case RuleId.FlipDesert:
      return flipDesert(ai, moves)
    case RuleId.Spy:
      return isPuttingSpiedItemBack(ai) ? putSpiedItemBack(ai, moves) : chooseSpiedPile(ai, moves)
    case RuleId.ChooseEffect:
      return chooseEffect(ai, moves)
    case RuleId.PlayCard:
      return playCardEffect(ai, moves)
    case RuleId.PayCardCost:
      return payCardCost(ai, moves)
    case RuleId.ActivateCard:
      return activateCard(ai, moves)
    case RuleId.ActivateTile:
      return activateTile(ai, moves)
    // The same tile, upgraded once it has given what its current face gives.
    case RuleId.ActivateAndUpgradeTile:
      return activateTile(ai, moves, true)
    case RuleId.RedrawMilitaryVictory:
      return redrawMilitaryVictory(ai, moves)
    case RuleId.TriggerMilitaryVictory:
      return triggerMilitaryVictory(ai, moves)
    case RuleId.PlaceSharkToken:
      return placeSharkToken(ai, moves)
    case RuleId.ActivateDesert:
      return activateDesert(ai, moves)
    case RuleId.DowngradeTile:
      return downgradeTile(ai, moves)
    case RuleId.SwapSquares:
      return swapSquares(ai, moves)
    case RuleId.CopyOpponentCard:
      return copyOpponentCard(ai, moves)
    case RuleId.SearchRing:
      return searchRing(ai, moves)
    case RuleId.SpendRingForToken:
      return spendRingForToken(ai, moves)
    case RuleId.RotateCatCard:
      return rotateCatCard(ai, moves)
    case RuleId.Awakening:
      return awaken(ai, moves)
    case RuleId.PlaceRing:
      return placeRing(ai, moves)
    // Every other rule of the game is one no player is ever asked anything in (see {@link RuleId}).
    default:
      return undefined
  }
}
