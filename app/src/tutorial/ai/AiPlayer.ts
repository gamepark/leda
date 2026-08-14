import { Clan } from '@gamepark/leda/Clan'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { ActionTileId } from '@gamepark/leda/material/ActionTileId'
import { ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { clanCardEffects } from '@gamepark/leda/material/clanCards/cardProperties'
import { Effect, effectEntries, EffectSet, EffectSource, isEffectChoice } from '@gamepark/leda/material/Effect'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { activableCells } from '@gamepark/leda/rules/activation'
import { canWinMilitaryVictory, effectQuantity } from '@gamepark/leda/rules/effects'
import { militarySymbols } from '@gamepark/leda/rules/militaryConflict'
import { playerClan, specialActivationEffects } from '@gamepark/leda/rules/specialActivation'
import { victorySymbolsToWin } from '@gamepark/leda/rules/victory'
import { XYCoordinates } from '@gamepark/rules-api'
import { sample } from 'es-toolkit'
import { comingActionTiles } from './actionTiles'

/**
 * What the AI is worth everything in: one currency, 1 Food being 1 point, so that a tile giving 2 Food and a card
 * drawing 2 cards can be compared at all.
 *
 * The lexicon of the game is what makes that possible: everything a tile, a card or a Military Victory token gives
 * is written as a set of effects (see {@link Effect}), so the AI prices the lexicon once and reads every square,
 * every card and every token through it, instead of holding an opinion about each of the 46 cards of the box.
 *
 * Two things are not a price and are worked out instead: the military symbols, whose worth is the conflict they
 * win rather than their number (see {@link militaryScore}), and the special activation, which is whatever the
 * clan of the player says it is.
 */

/** Everything the AI reads the game with: who it is, what it plays, and where the conflict of the round stands. */
export type Ai = {
  rules: LedaRules
  player: number
  opponent: number
  /** Undefined only during the setup, a clan being picked before anything of it exists. */
  clan?: Clan
  /** What each effect of the lexicon is worth to that clan (see {@link clanWeights}). */
  weights: Record<Effect, number>
  /** The military symbols worth reaching this round: 1 more than the opponent is expected to gather, and no more. */
  militaryNeed: number
  /** What taking the top Military Victory token is worth, and 0 when no token can be won this round. */
  conflictValue: number
  /** What 1 Food out of the purse costs, which is not what 1 Food gained is worth (see {@link cardCost}). */
  foodCost: number
  /**
   * The squares of the zone the player has still to activate, and the Action tiles still to be revealed.
   * Read once when the context is built rather than at every square of every candidate move: the AI reads its own
   * grid a few thousand times per decision, and neither of these changes while it is deciding.
   */
  pending: XYCoordinates[]
  coming: ActionTileId[]
}

/**
 * What everything of the lexicon is worth to a player who has no reason to favour any of it, on a scale where
 * 1 Food is 1 point. The clans below only bend what their own Victory condition card makes them care about.
 *
 * Military is priced at 0 here and worked out apart: what a symbol is worth is the conflict it wins, so the 3rd
 * one is worth everything when the opponent has 2 and nothing at all when they have none.
 * A special activation is priced at 0 for the same reason: it is worth what the clan of the player makes of it,
 * which is read straight off {@link specialActivationEffects}.
 */
const baseWeights: Record<Effect, number> = {
  [Effect.Food]: 1,
  [Effect.Draw]: 1.1,
  [Effect.Military]: 0,
  [Effect.Upgrade]: 1.6,
  [Effect.SpecialActivation]: 0,
  [Effect.Spy]: 0.6,
  [Effect.Flip]: 1.3,
  [Effect.StealFood]: 1.6,
  [Effect.Awakening]: 1.2,
  [Effect.PlayCard]: 0.9,
  [Effect.ActivateCard]: 2.2,
  [Effect.ActivateAndUpgradeTile]: 2.6,
  [Effect.MilitaryVictory]: 0,
  [Effect.RedrawMilitaryVictory]: 0.8,
  [Effect.TriggerMilitaryVictory]: 1.4,
  [Effect.PlaceSharkToken]: 2,
  [Effect.ActivateDesert]: 1.2,
  [Effect.UpgradeAndActivateTile]: 3,
  [Effect.SpyDifferentPiles]: 0.6,
  [Effect.FlipOpponentTile]: 1.5,
  [Effect.SwapSquares]: 1.2,
  [Effect.BlockMilitaryVictory]: 1,
  [Effect.ActivateTile]: 1.6,
  [Effect.CopyOpponentCard]: 2,
  [Effect.SearchRing]: 2,
  [Effect.SpendRingForToken]: 0.4,
  [Effect.RotateCatCard]: 0.9,
  [Effect.HalfTurn]: 0
}

/**
 * What each clan pays more for than the others, which is what its Victory condition card asks of it.
 *
 * The Pandas win on 2 Gold Pandas, and an Awakening is the one thing that ever brings one onto the grid.
 * The Sharks win on their 9 tokens, so placing one is worth more to them than anything a card gives.
 * The Cats win on 3 Rings, which they reach by drawing their deck out and by searching it.
 * The Scorpions win on 4 Portals, which are bought with Food and with nothing else.
 */
const clanWeights: Record<Clan, Partial<Record<Effect, number>>> = {
  [Clan.Panda]: { [Effect.Awakening]: 4, [Effect.PlayCard]: 1.1 },
  [Clan.Shark]: { [Effect.PlaceSharkToken]: 6 },
  [Clan.Cat]: { [Effect.Draw]: 2.6, [Effect.SearchRing]: 4, [Effect.RotateCatCard]: 1.6 },
  [Clan.Scorpion]: { [Effect.Food]: 1.8, [Effect.StealFood]: 2.6, [Effect.ActivateDesert]: 1.8, [Effect.SwapSquares]: 2.5 }
}

/**
 * What 1 Food of the price of a card costs its owner, which is not the same thing as what gaining 1 Food is worth:
 * a Scorpion values Food highly because their Portals are expensive, and for that very reason has to be the clan
 * that spends it most reluctantly on anything else (see {@link cardCost}).
 */
const clanFoodCost: Record<Clan, number> = {
  [Clan.Panda]: 1,
  [Clan.Shark]: 1,
  [Clan.Cat]: 1,
  [Clan.Scorpion]: 1.6
}

/**
 * What winning the conflict of the round is worth, which is not the same for the 2 players: the Victory condition
 * card of a clan says how many Victory symbols it needs, from 6 for the Scorpions to 9 for the Sharks, so the same
 * token takes a Scorpion a sixth of the way and a Shark a ninth of it.
 */
const conflictValue = (rules: LedaRules, clan?: Clan): number => {
  const tokensLeft = rules.material(MaterialType.MilitaryVictoryToken).location(LocationType.MilitaryVictoryDeck).length
  // A Scorpion Portal may have closed the round to tokens, and then no symbol gathered this round is worth a thing.
  if (tokensLeft === 0 || !canWinMilitaryVictory(rules)) return 0
  return 24 / (clan === undefined ? 7 : victorySymbolsToWin[clan])
}

/**
 * The AI, read for one player. The military need is what the caller expects the opponent to reach, and defaults to
 * what they have gathered so far: the rules that are played once both players are done activating, which is most
 * of them, read the true number there (see {@link militaryNeed}).
 */
export const aiPlayer = (rules: LedaRules, player: number, need?: number): Ai => {
  const clan = playerClan(rules, player)
  const opponent = rules.game.players.find((other) => other !== player) ?? player
  return {
    rules,
    player,
    opponent,
    clan,
    weights: { ...baseWeights, ...(clan === undefined ? {} : clanWeights[clan]) },
    militaryNeed: Math.max(1, need ?? militarySymbols(rules, opponent) + 1),
    conflictValue: conflictValue(rules, clan),
    foodCost: clan === undefined ? 1 : clanFoodCost[clan],
    pending: activableCells(rules, player),
    coming: comingActionTiles(rules)
  }
}

/** The same AI, reading the conflict against another expectation of what the opponent will gather. */
export const withMilitaryNeed = (ai: Ai, need: number): Ai => ({ ...ai, militaryNeed: Math.max(1, need) })

/**
 * What something gives: everything but the military symbols, priced in Food, and the symbols apart.
 * Kept apart because a symbol is not worth a number of anything: it is worth how much closer to the conflict of
 * the round it takes its owner, which only the total says (see {@link militaryScore}).
 */
export type Gain = { score: number; military: number }

export const noGain: Gain = { score: 0, military: 0 }

export const addGains = (a: Gain, b: Gain): Gain => ({ score: a.score + b.score, military: a.military + b.military })

export const sumGains = (gains: Gain[]): Gain => gains.reduce(addGains, noGain)

/**
 * What a total of military symbols is worth: the conflict it wins, and next to nothing beyond that.
 *
 * "Beating the opponent by 1 is enough" is the whole of it: the symbols up to the number that takes the lead are
 * worth their share of the token, and everything past that is worth the 0.1 that keeps the AI from throwing a
 * symbol away for nothing. So a zone giving 4 symbols is barely better than one giving 2 when the opponent can
 * only reach 1, and much better when they can reach 3.
 */
const militaryScore = (ai: Ai, symbols: number): number =>
  symbols <= 0 ? 0 : ai.conflictValue * Math.min(1, symbols / ai.militaryNeed) + 0.1 * symbols

/**
 * What a gain is worth, all in: what it gives, plus what its symbols are worth on top of the ones their owner has
 * already gathered. Marginal on purpose: the 1st symbol of a round and the 5th are not worth the same thing, and
 * pricing them apart is what makes the AI stop at the lead it needs.
 */
export const gainValue = (ai: Ai, gain: Gain, gathered = militarySymbols(ai.rules, ai.player)): number =>
  gain.score + militaryScore(ai, gathered + gain.military) - militaryScore(ai, gathered)

/**
 * By how many symbols a conflict is won on an ordinary round, which is the yardstick everything that is not being
 * resolved right now is measured against.
 */
const typicalConflict = 3

/**
 * What something is worth on a round that has not been played yet, which is what everything laid on a grid is
 * worth: a card played, a tile upgraded or 2 squares swapped give what they give from now on, on rounds whose
 * conflict is nobody's yet.
 *
 * Read apart from {@link gainValue} because the marginal price of a symbol is the whole point of that one: at the
 * end of a round the players are 4 to 2 and the 5th symbol is worth 0.1, which is exactly right for the effect
 * being resolved and exactly wrong for the card that is going to give it 8 rounds running.
 */
export const futureValue = (ai: Ai, gain: Gain): number => gainValue({ ...ai, militaryNeed: typicalConflict }, gain, 0)

/**
 * What a set of effects gives, whether it comes from a tile, a card or a Military Victory token.
 *
 * An "OR" is worth its best branch: the player picks, and the AI picks the same way it will pick when the game
 * asks it (see {@link chooseEffect}). The source is where the set was reached from, which the quantities some
 * cards are written as are read against, exactly as the rules read them (see {@link EffectQuantity}).
 */
export const effectsGain = (ai: Ai, effects: EffectSet, source: EffectSource = {}): Gain => {
  if (isEffectChoice(effects)) {
    const branches = effects.or.map((branch) => effectsGain(ai, branch, { item: effects.item, from: effects.from }))
    return branches.reduce((best, branch) => (gainValue(ai, branch) > gainValue(ai, best) ? branch : best), noGain)
  }
  return sumGains(
    effectEntries(effects).map(([effect, written]) => {
      const quantity = effectQuantity(ai.rules, ai.player, written, source)
      return quantity > 0 ? effectGain(ai, effect, quantity, source) : noGain
    })
  )
}

/** What one effect of a set gives, applied as many times as it is given. */
const effectGain = (ai: Ai, effect: Effect, quantity: number, source: EffectSource): Gain => {
  switch (effect) {
    case Effect.Military:
      return { score: 0, military: quantity }
    case Effect.SpecialActivation:
      // Whatever the Victory condition card of the clan makes of it, which for the Sharks is 2 military symbols.
      if (ai.clan === undefined) return noGain
      return sumGains(
        Array.from({ length: quantity }, () => effectsGain(ai, specialActivationEffects[ai.clan!], { ...source, from: Effect.SpecialActivation }))
      )
    case Effect.MilitaryVictory:
      // A token drawn out of turn is the token of a conflict, worth what a conflict is worth to this clan.
      return { score: quantity * ai.conflictValue, military: 0 }
    case Effect.HalfTurn:
      return { score: halfTurnValue(ai, source), military: 0 }
    default:
      return { score: quantity * ai.weights[effect], military: 0 }
  }
}

/**
 * What a Cat card taking its half turn is worth: the face it lands on, less the face it is leaving, since that is
 * what the square will give the next time it comes up. Half of that, because a Ring may turn it back by then
 * (see {@link RotateCatCardRule}), and because the turn is not a choice: it happens whether it suits or not.
 *
 * Read on the card itself and not on its square, exactly as the rules read it (see {@link Effect.HalfTurn}).
 * The 2 faces are valued with no source at all, which is what stops the recursion: a face gives its own half turn,
 * and a half turn with nothing giving it is worth nothing.
 */
const halfTurnValue = (ai: Ai, source: EffectSource): number => {
  if (source.item?.type !== MaterialType.ClanCard) return 0
  const card = ai.rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(source.item.index)
  if (card?.id?.front === undefined) return 0
  const rotated = card.location.rotation === true
  const here = gainValue(ai, effectsGain(ai, clanCardEffects(card.id.front, rotated)))
  const there = gainValue(ai, effectsGain(ai, clanCardEffects(card.id.front, !rotated)))
  return 0.5 * (there - here)
}

/** One scored candidate, which is how every decision of the AI is made: score them all, keep the best. */
export type Scored<T> = { move: T; score: number }

/**
 * The best of them, and one at random among those that tie. The ties are real and frequent, a grid holding 4 tiles
 * that give 1 Food each: always picking the first would have the AI work its way through a grid in reading order,
 * which is the one thing that reads as a machine rather than as an opponent.
 */
export const bestOf = <T>(candidates: Scored<T>[]): T | undefined => {
  if (candidates.length === 0) return undefined
  const best = Math.max(...candidates.map((candidate) => candidate.score))
  return sample(candidates.filter((candidate) => candidate.score >= best - 1e-9))!.move
}
