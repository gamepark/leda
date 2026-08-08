import { Material, MaterialMove, MaterialRules, MaterialRulesPart } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from './Memory'

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

/** Writing a Spy down is a rule's, unlike everything the app reads here. */
type Rule = MaterialRulesPart<number, MaterialType, LocationType>

type Move = MaterialMove<number, MaterialType, LocationType>

/**
 * The 3 piles a Spy effect may look into, in the order the lexicon of the rulebook lists them.
 * Each of them holds a material type of its own, which is what tells where an item taken from one goes back,
 * with nothing to remember: the type of the item the player is holding is the pile it came from.
 */
export const spiedPiles = [
  { type: MaterialType.ClanCard, pile: LocationType.PlayerDeck, owned: true },
  { type: MaterialType.ActionTile, pile: LocationType.ActionTileDeck, owned: false },
  { type: MaterialType.MilitaryVictoryToken, pile: LocationType.MilitaryVictoryDeck, owned: false }
] as const

export type SpiedPile = (typeof spiedPiles)[number]

export type SpiedItem = { pile: SpiedPile; material: Material<number, MaterialType, LocationType> }

/** The item the player is looking at, and the pile it came from, once they have taken one. */
export const spiedItem = (rules: Rules): SpiedItem | undefined => {
  for (const pile of spiedPiles) {
    const material = rules.material(pile.type).location(LocationType.SpiedItem)
    if (material.length > 0) return { pile, material }
  }
  return undefined
}

/** The whole of a pile, the deck of the player for the one pile that belongs to someone. */
const pileItems = (rules: Rules, player: number, pile: SpiedPile) => {
  const material = rules.material(pile.type).location(pile.pile)
  return pile.owned ? material.player(player) : material
}

/** The first item of a pile: the one on top of the stack, which is also the one that will be drawn next. */
export const pileTop = (rules: Rules, player: number, pile: SpiedPile) => pileItems(rules, player, pile).deck().limit(1)

/**
 * The piles a Spy effect may look into.
 *
 * The Action tiles are left out once their deck is down to its last one: the 4 others are face up between the
 * players, so everyone already knows which tile is left, and there is nothing to look at.
 *
 * The 2 other piles stay open however little they hold, even down to their last item. The look tells the player
 * which token or which card it is, which they have no other way of knowing, and that is worth an effect on its
 * own: only the choice of where to put it back becomes a formality, since an empty pile has no top and no bottom.
 */
export const spiablePiles = (rules: Rules, player: number): readonly SpiedPile[] =>
  spiedPiles.filter((pile) => pileItems(rules, player, pile).length > (pile.type === MaterialType.ActionTile ? 1 : 0))

/** The pile an item is on top of, when a Spy effect could take it from there. Read by the app to place its button. */
export const spiablePile = (rules: Rules, player: number, type: MaterialType, index: number): SpiedPile | undefined =>
  spiablePiles(rules, player).find((pile) => pile.type === type && pileTop(rules, player, pile).getIndexes().includes(index))

/**
 * Where the item the player is holding may go back: on top of its pile, which is the end of its sequence, hence
 * no x at all, or under it, which is x 0 and pushes the whole pile up one.
 * The rule offers these 2 moves and the app puts a button on each, so neither can name the other's.
 */
export const putBackMoves = (rules: Rules, player: number): { onTop: Move; under: Move } | undefined => {
  const spied = spiedItem(rules)
  if (spied === undefined) return undefined
  const pile = spied.pile.owned ? { type: spied.pile.pile, player } : { type: spied.pile.pile }
  return { onTop: spied.material.moveItem(pile), under: spied.material.moveItem({ ...pile, x: 0 }) }
}

/**
 * What a Spy of the round leaves behind: who looked, into which pile, and which end of it the item went back into.
 * The face of that item is not part of it and never will be: that is the whole of the effect, and it belongs to
 * the player who looked (see {@link Memory.Spies}).
 * The pile is its material type, which is what tells the 3 of them apart (see {@link spiedPiles}), and the player
 * is the owner of the one pile that belongs to somebody: a Spy only ever looks into its own player's deck.
 */
export type Spy = { player: number; pile: MaterialType; onTop: boolean }

/** The Spies of the round, in the order they were made. */
export const roundSpies = (rules: Rules): Spy[] => rules.game.memory[Memory.Spies] ?? []

/** One more of them, written down once the item is back in its pile: that is when the whole of it is known. */
export const rememberSpy = (rule: Rule, spy: Spy) => rule.memorize<Spy[]>(Memory.Spies, (spies: Spy[] = []) => [...spies, spy])

/**
 * Whether a Spy of the round is one of those a pile has to show for itself (see {@link SpyHistoryButton}).
 * A deck is a pile of its own, hence its owner: the 2 decks of the table are 2 piles, and a Spy on one of them
 * says nothing about the other.
 */
export const isSpyOnPile = (spy: Spy, type: MaterialType, owner?: number): boolean => {
  const pile = spiedPiles.find((spiable) => spiable.type === type)
  if (pile === undefined) return false
  return spy.pile === type && (!pile.owned || spy.player === owner)
}

/**
 * Whether an item is the one on top of its pile, which is where the buttons of that pile sit: a pile is drawn as
 * the stack of its items, and a button on each of them would be the same button drawn ten times.
 * The owner is the one of the pile, for the pile that has one, exactly as above.
 */
export const isPileTop = (rules: Rules, type: MaterialType, index: number, owner?: number): boolean => {
  const pile = spiedPiles.find((spiable) => spiable.type === type)
  if (pile === undefined || (pile.owned && owner === undefined)) return false
  return pileTop(rules, owner!, pile).getIndexes().includes(index)
}
