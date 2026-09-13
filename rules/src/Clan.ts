import { getEnumValues } from '@gamepark/rules-api'
import { ClanCardId } from './material/ClanCardId'

/**
 * The clans. During setup the players pick one each, one after the other, starting with the first player, so 2 of
 * them are in play in any given game. A clan is not a player id: it is chosen once the game is on.
 *
 * In the order of the box, which is the order they are offered in and the order everything else follows. The
 * Snakes come last, being the clan of the extension rather than one of the 4 the base box holds.
 */
export enum Clan {
  Panda = 1,
  Shark,
  Cat,
  Scorpion,
  Snake
}

/** Clan cards are numbered `100 * clan + n`, so the clan a card belongs to is read off its id. */
export const getClanCardClan = (card: ClanCardId): Clan => Math.floor(card / 100)

/** The cards of a clan, in punchboard order. */
export const clanCards = (clan: Clan): ClanCardId[] => getEnumValues(ClanCardId).filter((card) => getClanCardClan(card) === clan)

/** The clans a player can pick: all of them, since each has its cards. */
export const playableClans: Clan[] = getEnumValues(Clan).filter((clan) => clanCards(clan).length > 0)

/**
 * What a player takes when they pick a clan: cards off the top of their deck, and Food.
 * Printed in the top left corner of the Victory condition card of the clan, hence held per clan rather than as one
 * number for the game: the 4 clans of the base box start the same way, and the Snakes do not
 * (see {@link ChooseClanRule}, {@link VictoryConditionCardHelp}).
 */
export const clanStart: Record<Clan, { cards: number; food: number }> = {
  [Clan.Panda]: { cards: 3, food: 1 },
  [Clan.Shark]: { cards: 3, food: 1 },
  [Clan.Cat]: { cards: 3, food: 1 },
  [Clan.Scorpion]: { cards: 3, food: 1 },
  /** The one clan that opens with no Food at all, and one card fewer: it steals what it needs. */
  [Clan.Snake]: { cards: 2, food: 0 }
}
