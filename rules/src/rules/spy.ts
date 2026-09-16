import { isMoveItem, Material, MaterialMove, MaterialRules, MaterialRulesPart } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from './Memory'
import { playedEggs, spiedSide } from './snake'

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
export type PileSpy = { player: number; pile: MaterialType; onTop: boolean }

/**
 * A Spy spent on an Egg of the opponent's grid instead of a pile: there is no end of a pile to write down, only which
 * card was read, as its index, which follows the card wherever it goes from its square (see {@link spiableEggs}).
 * Its pile is the material type of that card, like the pile of a look on a deck is, so the look is read the same way.
 */
export type EggSpy = { player: number; pile: MaterialType.ClanCard; egg: number }

export type Spy = PileSpy | EggSpy

export const isEggSpy = (spy: Spy): spy is EggSpy => 'egg' in spy

/** The Spies of the round, in the order they were made. */
export const roundSpies = (rules: Rules): Spy[] => rules.game.memory[Memory.Spies] ?? []

/** One more of them, written down once the item is back in its pile: that is when the whole of it is known. */
export const rememberSpy = (rule: Rule, spy: Spy) => rule.memorize<Spy[]>(Memory.Spies, (spies: Spy[] = []) => [...spies, spy])

/**
 * Whether a Spy of the round is one of those a pile has to show for itself (see {@link SpyHistoryButton}).
 * A deck is a pile of its own, hence its owner: the 2 decks of the table are 2 piles, and a Spy on one of them
 * says nothing about the other.
 */
export const isSpyOnPile = (spy: Spy, type: MaterialType, owner?: number): spy is PileSpy => {
  const pile = spiedPiles.find((spiable) => spiable.type === type)
  if (pile === undefined || isEggSpy(spy)) return false
  return spy.pile === type && (!pile.owned || spy.player === owner)
}

/** Whether a Spy of the round is the one that read a card while it was an Egg, which that card has to show for itself. */
export const isSpyOnEgg = (spy: Spy, card: number): boolean => isEggSpy(spy) && spy.egg === card

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

/**
 * The Eggs a Spy effect may look at instead of a pile, which the sheet of the Snakes adds to the effect for as
 * long as that clan is in play: "its opponent may use a Spy effect to look at a Snake card placed on its Egg
 * side, instead of the other options normally offered by that effect".
 *
 * Their opponent's Eggs and never their own: a player already knows what they played, and looking at it would be
 * a Spy spent on nothing. A covered Egg is out of play and out of reach, exactly as it is out of every other
 * count (see {@link playedEggs}).
 *
 * An Egg already read this round is not offered again: its reader knows it, and reading it twice would be a Spy
 * spent on nothing, exactly as reading one's own Eggs would be (see {@link EggSpy}).
 */
export const spiableEggs = (rules: Rules, player: number): Material<number, MaterialType, LocationType> => {
  const opponent = rules.game.players.find((other: number) => other !== player)
  if (opponent === undefined) return rules.material(MaterialType.ClanCard).id(() => false)
  const read = roundSpies(rules).flatMap((spy) => (isEggSpy(spy) ? [spy.egg] : []))
  return playedEggs(rules, opponent).index((index) => !read.includes(index))
}

/**
 * The moves that read an Egg: the card turned over on its own square, onto the side that shows its Snake to both
 * players without hatching it (see {@link spiedSide}). Nothing is taken anywhere, so nothing has to be remembered
 * about where it goes back.
 */
export const eggLookMoves = (rules: Rules, player: number): Move[] =>
  spiableEggs(rules, player).moveItems((card) => ({ ...card.location, rotation: spiedSide }))

/** The Egg a Spy effect has turned over to read, if one is being read. */
export const spiedEgg = (rules: Rules): Material<number, MaterialType, LocationType> =>
  rules.material(MaterialType.ClanCard).location(LocationType.PlayedCard).rotation(spiedSide)

/** That Egg turned back onto its Egg side, which ends the Spy, exactly as a Snake paid with is (see {@link FlipSnakeToEggRule}). */
export const eggBackMove = (rules: Rules): Move | undefined => {
  const egg = spiedEgg(rules)
  return egg.length === 0 ? undefined : egg.moveItem((card) => ({ ...card.location, rotation: false }))
}

/**
 * Whether a move is the first of the 2 a Spy is made of: an item taken off a pile, or an Egg turned over to be read.
 * Read by the app, which finds the Spies of the round in the history of the moves (see {@link useRoundSpies}).
 */
export const isSpyLook = (move: Move): boolean =>
  isMoveItem(move) &&
  (move.location.type === LocationType.SpiedItem || (move.location.type === LocationType.PlayedCard && move.location.rotation === spiedSide))
