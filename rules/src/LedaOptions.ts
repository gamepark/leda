import { OptionsSpecV2 } from '@gamepark/rules-api'
import { Clan } from './Clan'
import { ClanSelection } from './ClanSelection'

/**
 * This is the type of object that the game receives when a new game is started.
 * By default the clan is not an option, it is picked during the game (see {@link Clan}), so players are simply numbered 1 and 2.
 *
 * `tournamentRules` plays the game the way tournaments do: both players may pick the same clan, and the 2 Military
 * Victory tokens worth 2 Victory symbols are left in the box. Absent when the host did not tick it.
 *
 * `clanSelection` lets each player pick their clan before the game ({@link ClanSelection.Free}): their clan is then
 * their player id. Absent in games created before the option existed, which pick it at the table.
 */
export type LedaOptions = {
  /** The table size, or one entry per player holding its clan as identity (ClanSelection.Free) */
  players: number | { id?: Clan }[]
  tournamentRules?: boolean
  clanSelection?: ClanSelection
}

/**
 * The structure of everything a host can choose before the game starts — and nothing else.
 *
 * Beside the table size, which is always 2, the choices are whether to play with the tournament rules, and whether
 * the clans are picked at the table or before the game, as the player identities.
 *
 * Two things are deliberately absent from this declaration, both because they change without the game changing:
 *
 * - **Text.** No labels, no help. They live in `app/public/options/<locale>.json`, published beside the
 *   game's translations and keyed by convention: `option.<option>`, `option.<option>.<value>`,
 *   `identities.<value>`, plus optional `.help` variants. A boolean has no value to label, so
 *   `option.<option>` and its `.help` are all each of them needs.
 * - **Subscription and competitive gates.** Which options require a subscription, and which are allowed in
 *   ranked play, are the platform's decisions. They live in its database and are edited there.
 *
 * The declaration is plain JSON on purpose: the platform snapshots it when the bundle is prepared, so every
 * screen reads the option space without downloading and running a game bundle.
 *
 * `players` must match the range declared for the game on the platform — it is the root that every other
 * range narrows, and a disagreement silently changes which tables exist.
 */
export const LedaOptionsSpecV2: OptionsSpecV2 = {
  specVersion: 2,
  players: { min: 2, max: 2 },
  options: {
    tournamentRules: { kind: 'boolean' },
    clanSelection: { kind: 'enum', values: [ClanSelection.InGame, ClanSelection.Free] }
  },
  // Players are their clan only when they pick it freely; otherwise they are numbered and choose at the table.
  // An identity being unique, a free selection never makes a mirror match, tournament rules or not.
  identities: {
    requires: [{ option: 'clanSelection', values: [ClanSelection.Free] }],
    values: [Clan.Panda, Clan.Shark, Clan.Cat, Clan.Scorpion, Clan.Snake]
  }
}
