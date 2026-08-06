import { ClanCardId } from '@gamepark/leda/material/ClanCardId'
import { Ring } from '@gamepark/leda/material/clanCards/catCards'
import { ringCatCardsInZone, ringConflictLead, ringUpgradedTiles } from '@gamepark/leda/rules/rings'

/**
 * What each Ring asks for before it may be put in play, which is the whole of what tells them apart: the effect is
 * the same on all 4 (see {@link ringPlacements}). The numbers are read off the rules rather than written into the
 * texts, so that nothing showing them can lie about what the card asks.
 *
 * Read wherever a Ring has to say what it waits for: the dialog that picks one out of the deck
 * (see {@link SearchRingDialog}) and the help of the card itself (see {@link ClanCardHelp}).
 */
export const ringConditions: Record<Ring, { code: string; count?: number }> = {
  [ClanCardId.CatRingWinConflictByThree]: { code: 'win-conflict', count: ringConflictLead },
  [ClanCardId.CatRingEmptyDeck]: { code: 'empty-deck' },
  [ClanCardId.CatRingThreeCatCards]: { code: 'three-cat-cards', count: ringCatCardsInZone },
  [ClanCardId.CatRingFiveUpgradedTiles]: { code: 'five-upgraded-tiles', count: ringUpgradedTiles }
}
