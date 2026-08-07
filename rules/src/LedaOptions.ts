import { OptionsSpecV2 } from '@gamepark/rules-api'

/**
 * This is the type of object that the game receives when a new game is started.
 * Leda is a 2-player game with no variant: the players do not choose anything before the game starts.
 * The clan is not an option, it is picked during the game (see {@link Clan}), so players are simply numbered 1 and 2.
 */
export type LedaOptions = {
  players: number
}

/**
 * The structure of everything a host can choose before the game starts — and nothing else.
 *
 * Leda has nothing to choose: no variant, and no identity to pick, since the clan is taken during the game.
 * The whole option space is therefore the table size, which is always 2.
 *
 * Two things are deliberately absent from this declaration, both because they change without the game changing:
 *
 * - **Text.** No labels, no help. They would live in `app/public/options/<locale>.json`, published beside the
 *   game's translations and keyed by convention: `option.<option>`, `option.<option>.<value>`,
 *   `identities.<value>`, plus optional `.help` variants. Leda declares no option and no identity, so it has
 *   no such key and no such file.
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
  players: { min: 2, max: 2 }
}
