import { Material, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'

/** All these helpers need, which a part of the rules and the MaterialRules instance of the app both satisfy. */
type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>

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

/** The first item of a pile: the one on top of the stack, which is also the one that will be drawn next. */
export const pileTop = (rules: Rules, player: number, pile: SpiedPile) => {
  const material = rules.material(pile.type).location(pile.pile)
  return (pile.owned ? material.player(player) : material).deck().limit(1)
}

/** The pile an item is on top of, when a Spy effect could take it from there. Read by the app to place its button. */
export const spiablePile = (rules: Rules, player: number, type: MaterialType, index: number): SpiedPile | undefined =>
  spiedPiles.find((pile) => pile.type === type && pileTop(rules, player, pile).getIndexes().includes(index))

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
