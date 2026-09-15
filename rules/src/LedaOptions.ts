import { OptionsSpecV2 } from '@gamepark/rules-api'

/**
 * This is the type of object that the game receives when a new game is started.
 * The clan is not an option, it is picked during the game (see {@link Clan}), so players are simply numbered 1 and 2.
 *
 * `tournamentRules` plays the game the way tournaments do: both players may pick the same clan, and the 2 Military
 * Victory tokens worth 2 Victory symbols are left in the box. Absent when the host did not tick it.
 *
 * `snakesClan` adds the Snakes, the clan of the extension, to the clans the players may pick. Without it they are
 * neither offered nor shown. Absent when the host did not tick it.
 */
export type LedaOptions = {
  players: number
  tournamentRules?: boolean
  snakesClan?: boolean
}

/**
 * The structure of everything a host can choose before the game starts — and nothing else.
 *
 * Leda has no identity to pick, since the clan is taken during the game. Beside the table size, which is always 2,
 * the only choices are whether to play with the tournament rules, and whether the Snakes may be picked.
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
    snakesClan: { kind: 'boolean' }
  }
}
