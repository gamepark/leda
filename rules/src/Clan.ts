import { getEnumValues } from '@gamepark/rules-api'
import { ClanCardId } from './material/ClanCardId'

/**
 * The 4 clans. During setup the players pick one each, one after the other, starting with the first player,
 * so 2 of these 4 are in play in any given game. A clan is not a player id: it is chosen once the game is on.
 */
export enum Clan {
  Cat = 1,
  Panda,
  Shark,
  Scorpion
}

/** Clan cards are numbered `100 * clan + n`, so the clan a card belongs to is read off its id. */
export const getClanCardClan = (card: ClanCardId): Clan => Math.floor(card / 100)

/** The cards of a clan, in punchboard order. */
export const clanCards = (clan: Clan): ClanCardId[] => getEnumValues(ClanCardId).filter((card) => getClanCardClan(card) === clan)

/** The clans a player can pick. The Pandas have no cards yet, so they are left out until their material exists. */
export const playableClans: Clan[] = getEnumValues(Clan).filter((clan) => clanCards(clan).length > 0)
