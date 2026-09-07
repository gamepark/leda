import { Material, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Rules } from '../Rules'

type Cards = Material<number, MaterialType, LocationType>

/**
 * Showing a card to both players on its way somewhere else, which 2 of the Cat cards ask for: the Ring searched
 * for in a deck is revealed before it joins the hand of its owner (see {@link SearchRingRule}), and the Ring
 * traded for a Military Victory token is revealed before it goes under their deck
 * (see {@link SpendRingForTokenRule}).
 *
 * A step of its own rather than something the move it precedes carries: a card coming out of a deck and a card
 * going back under one are both moves between 2 places nobody reads, so revealing has to be a place of its own for
 * anything to be seen at all (see {@link LocationType.RevealedCard}).
 *
 * Revealing is what landing there does, that location being hidden from nobody: the move is public, so both
 * players read which Ring it is, and the journal writes it down with them (see {@link LedaHistory}).
 * How long it stays in sight belongs to the app alone, the rules moving it out as soon as it lands.
 */
export const revealMoves = (cards: Cards, player: number): MaterialMove<number, MaterialType, LocationType>[] =>
  cards.moveItems({ type: LocationType.RevealedCard, player })

/** The card a player is showing right now, which is at most one and only for as long as a move takes to follow. */
export const revealedCard = (rules: Rules, player: number): Cards =>
  rules.material(MaterialType.ClanCard).location(LocationType.RevealedCard).player(player)
