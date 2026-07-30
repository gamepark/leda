/**
 * The clan cards a player draws and then plays onto their grid: 13 for the Cats, 11 for each other clan.
 * The Victory condition card of a clan is not one of them, it is a material type of its own.
 *
 * Ids are numbered `100 * clan + n`, so `Math.floor(id / 100)` gives the Clan a card belongs to, and the Pandas
 * can be added later without renumbering anything. Within a clan, the order is the order of the punchboard.
 *
 * The cards have no printed name, only icons, so the values are named after what they do. The effects below come
 * from the clan sheets (REGLES LEDA <clan>.pdf); costs are in Food unless stated otherwise.
 */
export enum ClanCardId {
  // Cats. Each non-Ring card has 2 effects: activating the card resolves the first one and rotates the card 180°,
  // so that the next activation resolves the second one and rotates it back.

  /** Cost 3 cards. 1: copy the effect of a card your opponent can activate this turn. 2: draw 2 cards. */
  CatCopyOpponentCard = 101,
  /** Cost 2. 1: search a Ring in your deck, reveal it, add it to your hand and shuffle. 2: nothing. */
  CatSearchRing,
  /** Cost 2 cards. 1: upgrade 1 card. 2: activate one of your tiles, upgraded or not. */
  CatUpgradeCardOrActivateTile,
  /** Cost 7. 1: gain 1 Military per card in your hand. 2: gain 1 Food per card in your hand. */
  CatMilitaryOrFoodPerCardInHand,
  /** Cost 4. 1: Spy, then draw 1 card. 2: nothing. */
  CatSpyAndDraw,
  /** Cost 5. 1: you may reveal a Ring from your hand and put it under your deck to draw and resolve 1 Military Victory token. 2: nothing. */
  CatSpendRingForToken,
  /** Cost 1 card. 1: gain 1 Food and 1 Military. 2: nothing. */
  CatFoodAndMilitary,
  /** Cost 5. 1: draw 1 card and gain 1 Food. 2: nothing. */
  CatDrawAndFood,
  /** Cost 6. 1: gain 2 Military. 2: upgrade 1 tile. */
  CatMilitaryOrUpgrade,

  // The 4 Rings. A Ring has no cost and is played for free, without spending an action, as soon as its condition
  // is met. Playing 3 of them wins the game. Their effect is always "you may Rotate one of your Cat cards".

  /** Red Ring. Condition: win a Military conflict by 3 symbols or more. */
  CatRingWinConflictByThree = 110,
  /** Blue Ring. Condition: empty your deck. */
  CatRingEmptyDeck,
  /** Purple Ring. Condition: activate a zone holding at least 3 Cat cards. */
  CatRingThreeCatCards,
  /** Orange Ring. Condition: have 5 upgraded tiles. */
  CatRingFiveUpgradedTiles,

  // Pandas: 201 to 211. Their card images are missing from the assets, so their ids are not defined yet.

  // Sharks. Each card has a normal effect and a Pack effect, the Pack one replacing the normal one while the
  // card is orthogonally adjacent to 2 Shark tokens.

  /** Cost 6. Upgrade one of your tiles. Pack: activate one of your tiles, then upgrade it if possible. */
  SharkUpgrade = 301,
  /** Cost 6. Spy. Pack: gain 1 Military and trigger the effect of one of your Military Victory tokens. */
  SharkSpyOrTriggerToken,
  /** Cost 3. Nothing. Pack: put one of your Military Victory tokens back under the pile and draw a new one. */
  SharkPackRedrawToken,
  /** Cost 5. Gain 1 Military. Pack: gain 2 Military. */
  SharkMilitary,
  /** Cost 4. Gain 1 Military. Pack: gain 1 Military and draw 1 card. */
  SharkMilitaryAndDraw,
  /** Cost 7. Gain 2 Military. Pack: gain 1 Military per orthogonally adjacent Shark token. */
  SharkMilitaryPerToken,
  /** Cost 7. Nothing. Pack: draw 1 Military Victory token and resolve its effect. */
  SharkPackDrawToken,
  /** Cost 5. Gain 1 Food. Pack: you may play a card from your hand, reducing its cost by 2 Food. */
  SharkFoodOrDiscount,
  /** Cost 7. Gain 1 Food per pair of Military Victory tokens you own. Pack: gain 1 Food per token you own. */
  SharkFoodPerToken,
  /** Cost 3. Nothing. Pack: place a Shark token on one of your tiles that has none. */
  SharkPackPlaceToken,
  /** Cost 3. Nothing. Pack: Spy. */
  SharkPackSpy,

  // Scorpions. No keyword of their own: most of their cards scale with the number of Deserts in their grid.
  // Their 4 Portals win the game if they end up in the 4 corners of the grid, and get cheaper as the game goes on.

  /** Cost 3. Gain 1 Food per pair of Deserts you own. */
  ScorpionFoodPerDesertPair = 401,
  /** Cost 3. Gain 1 Military per pair of Deserts you own. */
  ScorpionMilitaryPerDesertPair,
  /** Cost 3. Draw 1 card and gain 1 Food. */
  ScorpionDrawAndFood,
  /** Cost 3. You may play a card from your hand, reducing its cost by 1 Food per pair of Deserts you own. */
  ScorpionDiscountPerDesertPair,
  /** Cost 3. Activate the effect reminded on one of your Deserts. */
  ScorpionActivateDesert,
  /** Cost 4. Upgrade one of your tiles, then activate it if possible. */
  ScorpionUpgradeAndActivate,
  /** Cost 2. Gain 1 Food, then, if you control 1/2/3 Portals: Spy / + gain 1 Military / + activate one of your Deserts. */
  ScorpionFoodAndPortalBonus,

  /** Portal, cost 9 minus the number of cards in your hand. Spy twice, on 2 different piles. */
  ScorpionPortalDoubleSpy = 408,
  /** Portal, cost 9 minus your number of upgraded tiles. Your opponent flips one of their tiles to its Desert or non-upgraded side. */
  ScorpionPortalFlipOpponentTile,
  /** Portal, cost 9 minus your number of Portals. Swap the position of 2 of your cards or tiles. */
  ScorpionPortalSwap,
  /** Portal, cost 9 minus your number of Military Victory tokens. No player may gain a Military Victory token this round. */
  ScorpionPortalBlockMilitaryVictory
}
