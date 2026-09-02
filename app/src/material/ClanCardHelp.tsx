import { Clan } from '@gamepark/leda/Clan'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { ClanCardId, ClanCardItemId, clanOf } from '@gamepark/leda/material/ClanCardId'
import { Effect, EffectSet, isEffectChoice } from '@gamepark/leda/material/Effect'
import { clanCardFoodCost, clanCardProperties } from '@gamepark/leda/material/clanCards/cardProperties'
import { isRing } from '@gamepark/leda/material/clanCards/catCards'
import { PandaLevel } from '@gamepark/leda/material/clanCards/PandaLevel'
import { isPortal } from '@gamepark/leda/material/clanCards/scorpionCards'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { awakeningGroup } from '@gamepark/leda/rules/awakening'
import { MaterialHelpProps, useRules } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'
import PandaBronzeImage from '../images/icons/PandaBronze.png'
import PandaSilverImage from '../images/icons/PandaSilver.png'
import { activationRuleCode, HelpText, HelpTitle, Line, Note, Paragraph } from './helpLayout'
import { ringConditions } from './ringConditions'

/**
 * The code a card is written under in the translation files, which is the name of its image file: the texts of the
 * 46 cards are the bulk of this help, and reading a key such as `help.card.cat-search-ring` beside the card it
 * belongs to is what makes them checkable against the rulebook.
 *
 * A card that prints 2 effects has a second key, suffixed `-2`: effect 2 of a Cat card, the Pack effect of a Shark
 * card. A Portal has one too, `-cost`, for the formula its price is written as.
 *
 * Total rather than partial: a card added to {@link ClanCardId} without a text of its own does not compile.
 */
const clanCardCodes: Record<ClanCardId, string> = {
  [ClanCardId.PandaDrawAndSpecialActivation]: 'panda-draw-and-special-activation',
  [ClanCardId.PandaUpgrade]: 'panda-upgrade',
  [ClanCardId.PandaFoodOrMilitary]: 'panda-food-or-military',
  [ClanCardId.PandaFoodAndDiscount]: 'panda-food-and-discount',
  [ClanCardId.PandaDrawOrMilitary]: 'panda-draw-or-military',
  [ClanCardId.PandaFoodAndSpy]: 'panda-food-and-spy',
  [ClanCardId.PandaMilitary]: 'panda-military',
  [ClanCardId.PandaMilitaryAndUpgrade]: 'panda-military-and-upgrade',
  [ClanCardId.PandaSpyAndDiscount]: 'panda-spy-and-discount',
  [ClanCardId.PandaKing]: 'panda-king',
  [ClanCardId.PandaQueen]: 'panda-queen',
  [ClanCardId.SharkUpgrade]: 'shark-upgrade',
  [ClanCardId.SharkSpyOrTriggerToken]: 'shark-spy-or-trigger-token',
  [ClanCardId.SharkPackRedrawToken]: 'shark-pack-redraw-token',
  [ClanCardId.SharkMilitary]: 'shark-military',
  [ClanCardId.SharkMilitaryAndDraw]: 'shark-military-and-draw',
  [ClanCardId.SharkMilitaryPerToken]: 'shark-military-per-token',
  [ClanCardId.SharkPackDrawToken]: 'shark-pack-draw-token',
  [ClanCardId.SharkFoodOrDiscount]: 'shark-food-or-discount',
  [ClanCardId.SharkFoodPerToken]: 'shark-food-per-token',
  [ClanCardId.SharkPackPlaceToken]: 'shark-pack-place-token',
  [ClanCardId.SharkPackSpy]: 'shark-pack-spy',
  [ClanCardId.CatCopyOpponentCard]: 'cat-copy-opponent-card',
  [ClanCardId.CatSearchRing]: 'cat-search-ring',
  [ClanCardId.CatUpgradeCardOrActivateTile]: 'cat-upgrade-card-or-activate-tile',
  [ClanCardId.CatMilitaryOrFoodPerCardInHand]: 'cat-military-or-food-per-card-in-hand',
  [ClanCardId.CatSpyAndDraw]: 'cat-spy-and-draw',
  [ClanCardId.CatSpendRingForToken]: 'cat-spend-ring-for-token',
  [ClanCardId.CatFoodAndMilitary]: 'cat-food-and-military',
  [ClanCardId.CatDrawAndFood]: 'cat-draw-and-food',
  [ClanCardId.CatMilitaryOrUpgrade]: 'cat-military-or-upgrade',
  [ClanCardId.CatRingWinConflictByThree]: 'cat-ring',
  [ClanCardId.CatRingEmptyDeck]: 'cat-ring',
  [ClanCardId.CatRingThreeCatCards]: 'cat-ring',
  [ClanCardId.CatRingFiveUpgradedTiles]: 'cat-ring',
  [ClanCardId.ScorpionFoodPerDesertPair]: 'scorpion-food-per-desert-pair',
  [ClanCardId.ScorpionMilitaryPerDesertPair]: 'scorpion-military-per-desert-pair',
  [ClanCardId.ScorpionDrawAndFood]: 'scorpion-draw-and-food',
  [ClanCardId.ScorpionDiscountPerDesertPair]: 'scorpion-discount-per-desert-pair',
  [ClanCardId.ScorpionActivateDesert]: 'scorpion-activate-desert',
  [ClanCardId.ScorpionUpgradeAndActivate]: 'scorpion-upgrade-and-activate',
  [ClanCardId.ScorpionFoodAndPortalBonus]: 'scorpion-food-and-portal-bonus',
  [ClanCardId.ScorpionPortalDoubleSpy]: 'scorpion-portal-double-spy',
  [ClanCardId.ScorpionPortalFlipOpponentTile]: 'scorpion-portal-flip-opponent-tile',
  [ClanCardId.ScorpionPortalSwap]: 'scorpion-portal-swap',
  [ClanCardId.ScorpionPortalBlockMilitaryVictory]: 'scorpion-portal-block-military-victory'
}

/** The Scorpion cards whose text counts the Deserts of their owner, which is worth a word of what a Desert is. */
const desertCards: ClanCardId[] = [
  ClanCardId.ScorpionFoodPerDesertPair,
  ClanCardId.ScorpionMilitaryPerDesertPair,
  ClanCardId.ScorpionDiscountPerDesertPair,
  ClanCardId.ScorpionActivateDesert,
  ClanCardId.ScorpionFoodAndPortalBonus
]

/**
 * The Pandas an Awakening asks for, level by level: 2 Bronze ones to reach Silver, 2 Silver ones to reach Gold.
 * Indexed by the level of the card being read, so a card says what it takes to reach itself, and empty for the
 * Bronze ones, which are bought rather than awakened (see {@link pandaCards}).
 */
const awakeningRequirement: Partial<Record<PandaLevel, string>> = {
  [PandaLevel.Silver]: PandaBronzeImage,
  [PandaLevel.Gold]: PandaSilverImage
}

/**
 * What a clan card does, told the way its clan sheet tells it: what it costs, the effect or the 2 effects it
 * prints, and a reminder of the keyword it leans on when it leans on one.
 *
 * Everything but the texts is read off the rules rather than written down here: which effects a card prints, what
 * it is paid with, whether it is a Ring or a Portal. So a card whose price or shape changes cannot end up with a
 * help that still describes the old one, and only its sentence has to be rewritten.
 */
export const ClanCardHelp = ({ item }: MaterialHelpProps<number, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  const id = item.id as ClanCardItemId | undefined
  const card = id?.front
  return (
    <>
      {/*
       * A clan card has no name: the clan it belongs to is the whole of what it is called, and it is read off the
       * back of the card rather than off its front, which a hidden card does not have. So a card an opponent holds
       * is named like any other: its back is the emblem of its clan, and it is the one thing about it that is open.
       */}
      {id !== undefined && <HelpTitle>{t(`help.title.${id.back}`)}</HelpTitle>}
      {card === undefined ? (
        <Paragraph>{t('help.hidden')}</Paragraph>
      ) : (
        <>
          <CardCost card={card} player={item.location?.player} />
          <CardEffects card={card} />
          {/* The Awakening reminder is the one that counts the Pandas it takes; the others read no number. */}
          {cardNotes(card).map((note) => (
            <Note key={note} code={note} values={{ count: awakeningGroup }} />
          ))}
        </>
      )}
    </>
  )
}

/**
 * What has to happen before the card reaches the grid. Which of the 4 ways it is is asked of the card itself:
 * a price in Food, a price in cards from the hand, the condition of a Ring, or the Awakening of a Panda that is
 * never bought (see {@link ClanCardProperties}).
 *
 * A Portal is the one whose price cannot be printed, since it goes down as the game goes on: its formula is
 * written out, and what it comes to right now is worked out beside it, for the player whose card this is.
 */
const CardCost = ({ card, player }: { card: ClanCardId; player?: number }) => {
  const { t } = useTranslation()
  const rules = useRules<LedaRules>()
  const { cost, pandaLevel } = clanCardProperties[card]
  if (cost === undefined) {
    if (isRing(card)) {
      const { code, count } = ringConditions[card]
      return <Line label={t('search-ring.condition')}>{t(`search-ring.${code}`, { count })}</Line>
    }
    const required = pandaLevel === undefined ? undefined : awakeningRequirement[pandaLevel]
    if (required === undefined) return null
    return (
      <Line label={t('help.cost')}>
        <HelpText code="help.awakening" values={{ count: awakeningGroup }} level={required} />
      </Line>
    )
  }
  if ('cards' in cost) return <Line label={t('help.cost')}>{t('help.cards-cost', { count: cost.cards })}</Line>
  if (typeof cost.food === 'number') {
    return (
      <Line label={t('help.cost')}>
        <HelpText code="help.food-cost" values={{ count: cost.food }} />
      </Line>
    )
  }
  const current = rules === undefined || player === undefined ? undefined : clanCardFoodCost(card, rules, player)
  return (
    <Line label={t('help.cost')}>
      <HelpText code={`help.card.${clanCardCodes[card]}-cost`} />
      {current !== undefined && (
        <>
          {' '}
          <HelpText code="help.current" values={{ count: current }} />
        </>
      )}
    </Line>
  )
}

/**
 * What the card gives once its square is activated, under the headings its own clan prints: one effect for a Panda
 * or a Scorpion, an effect and a Pack effect for a Shark, effect 1 and effect 2 for a Cat card that turns itself
 * over. Which of the 2 is the live one is not said here: the card on the table shows it, upright or covered.
 */
const CardEffects = ({ card }: { card: ClanCardId }) => {
  const { t } = useTranslation()
  const code = clanCardCodes[card]
  const { effects } = clanCardProperties[card]
  switch (clanOf(card)) {
    case Clan.Cat:
      if (isRing(card)) break
      return (
        <>
          <Line label={t('help.effect-1')}>
            <CardText code={code} />
          </Line>
          <Line label={t('help.effect-2')}>
            <CardText code={`${code}-2`} />
          </Line>
        </>
      )
    case Clan.Shark:
      return (
        <>
          {/* The 4 cheap Shark cards print nothing at all outside of their Pack, which is what makes them cheap. */}
          <Line label={t('help.effect')}>{effects === undefined ? t('help.none') : <CardText code={code} />}</Line>
          <Line label={t('help.pack')}>
            <CardText code={`${code}-2`} />
          </Line>
        </>
      )
  }
  return (
    <Line label={t(isPortal(card) ? 'help.portal' : 'help.effect')}>
      <CardText code={code} />
    </Line>
  )
}

/**
 * The reminders under the card: the keywords of its clan, and the once-per-activation rule for the cards it bears
 * on, which is the one rule of the game the box answers in its FAQ rather than in its rulebook.
 */
const cardNotes =(card: ClanCardId): string[] => [...clanNotes(card), ...(activatesOutOfTurn(card) ? [activationRuleCode] : [])]

/**
 * The effects that reach into a grid to have something activated out of turn, plus the swap that moves what a
 * grid holds around: the cards printing one of them are the ones the once-per-activation rule can surprise a
 * player on, whether by leaving out the square they were aiming at or by carrying something already activated
 * onto a square nobody has been through (see {@link Memory.ActivatedItems}).
 *
 * Read off the effects rather than listed by name, so that a card printing one of them cannot be added without
 * its help saying so, exactly as the rest of this help is read off the rules.
 */
const activationEffects: Effect[] = [
  Effect.ActivateCard,
  Effect.ActivateTile,
  Effect.ActivateAndUpgradeTile,
  Effect.UpgradeAndActivateTile,
  Effect.ActivateDesert,
  Effect.SwapSquares
]

/** Which effects a set prints, the branches of an "OR" included, since either of them may be the one picked. */
const effectsOf = (effects?: EffectSet): Effect[] =>
  effects === undefined ? [] : isEffectChoice(effects) ? effects.or.flatMap(effectsOf) : (Object.keys(effects) as Effect[])

/** Whether either face of the card prints one of them: a Cat card prints 2, and a Shark card prints its Pack. */
const activatesOutOfTurn = (card: ClanCardId): boolean => {
  const { effects, secondEffects } = clanCardProperties[card]
  return [...effectsOf(effects), ...effectsOf(secondEffects)].some((effect) => activationEffects.includes(effect))
}

/** The reminders of the clan of the card, which are its keywords and are written on its clan sheet. */
const clanNotes = (card: ClanCardId): string[] => {
  switch (clanOf(card)) {
    /** Every Panda that has a level: the Bronze ones an Awakening takes away as much as the ones it brings in. */
    case Clan.Panda:
      return clanCardProperties[card].pandaLevel === undefined ? [] : ['help.note.awakening']
    case Clan.Shark:
      return ['help.note.pack']
    case Clan.Cat:
      return [isRing(card) ? 'help.note.ring' : 'help.note.rotation']
    case Clan.Scorpion:
      return isPortal(card) ? ['help.note.portal'] : desertCards.includes(card) ? ['help.note.desert'] : []
  }
}

const CardText = ({ code }: { code: string }) => <HelpText code={`help.card.${code}`} />
