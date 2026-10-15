import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { ClanCardItemId } from '@gamepark/leda/material/ClanCardId'
import { isRing } from '@gamepark/leda/material/clanCards/catCards'
import { PandaLevel } from '@gamepark/leda/material/clanCards/PandaLevel'
import { isPortal } from '@gamepark/leda/material/clanCards/scorpionCards'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { gridCorners } from '@gamepark/leda/material/PlayerGrid'
import { Rules } from '@gamepark/leda/Rules'
import { MaterialRules } from '@gamepark/rules-api'
import { pandaLevel } from '@gamepark/leda/rules/awakening'
import { placedSharkTokens } from '@gamepark/leda/rules/sharkPack'
import { hatchedSnakes } from '@gamepark/leda/rules/snake'
import { playerClan } from '@gamepark/leda/rules/specialActivation'
import { topCardIndexOn, visibleCards } from '@gamepark/leda/rules/squares'
import { gameWinner, hasMilitaryVictory, hasSpecialVictory } from '@gamepark/leda/rules/victory'

/**
 * Once the game is over, the items that won it jump on the table for as long as it is shown: the race that ended
 * the game is the one thing the table cannot point at otherwise, its count being spread over a grid or a row of
 * tokens (see {@link VictorySound}, heard once when they start).
 *
 * The items of the race that was run and of that one alone, both when one move met the 2 conditions at once:
 * - the military victory: the Military Victory tokens of the winner, all of them counting;
 * - the victory of their clan: what its Victory condition card counts, as the rules count it (see {@link victory}).
 */

/** The items of one type that won the game, in the order they jump in. Empty while the game goes on. */
export const celebratedItems = (rules: MaterialRules<number, MaterialType, LocationType>, type: MaterialType): number[] => {
  if (!rules.isOver()) return []
  const winner = gameWinner(rules)
  if (winner === undefined) return []
  const items: number[] = []
  if (type === MaterialType.MilitaryVictoryToken && hasMilitaryVictory(rules, winner)) {
    items.push(...rules.material(type).location(LocationType.PlayerMilitaryVictory).player(winner).sort((item) => item.location.x!).getIndexes())
  }
  const clan = playerClan(rules, winner)
  if (clan !== undefined && hasSpecialVictory(rules, winner)) items.push(...clanVictoryItems(rules, winner, clan, type))
  return items
}

/** What each clan counts towards its own victory, as items on the table. */
const clanVictoryItems = (rules: Rules, player: number, clan: Clan, type: MaterialType): number[] => {
  switch (clan) {
    case Clan.Panda:
      return type !== MaterialType.ClanCard
        ? []
        : visibleCards(rules, player)
            .id<ClanCardItemId>((id) => pandaLevel(id.front) === PandaLevel.Gold)
            .getIndexes()
    case Clan.Shark:
      return type === MaterialType.SharkToken ? placedSharkTokens(rules, player).getIndexes() : []
    case Clan.Cat:
      return type !== MaterialType.ClanCard
        ? []
        : visibleCards(rules, player)
            .id<ClanCardItemId>((id) => isRing(id.front))
            .getIndexes()
    case Clan.Scorpion:
      return type !== MaterialType.ClanCard
        ? []
        : gridCorners.flatMap((corner) => {
            const index = topCardIndexOn(rules, player, corner)
            const card = index === undefined ? undefined : rules.material(MaterialType.ClanCard).getItem<ClanCardItemId>(index).id?.front
            return index !== undefined && card !== undefined && isPortal(card) ? [index] : []
          })
    case Clan.Snake:
      return type === MaterialType.ClanCard ? hatchedSnakes(rules, player).getIndexes() : []
  }
}

/**
 * The css of an item that won the game, if it is one: added to the {@link MaterialDescription.getItemExtraCss} of
 * every type that can win it.
 */
export const celebrationCss = (rules: MaterialRules<number, MaterialType, LocationType>, type: MaterialType, index: number): Interpolation<Theme> => {
  const rank = celebratedItems(rules, type).indexOf(index)
  return rank === -1 ? undefined : jumpingCss(rank * jumpStagger, type !== MaterialType.MilitaryVictoryToken)
}

/** The seconds a jump lasts, and the seconds from one jump of an item to its next, the rest being a pause. */
const jumpDuration = 0.8
const jumpPeriod = 3.5

/** Where the jump is at its top, and where it lands, as keyframes of the whole period. */
const top = `${(50 * jumpDuration) / jumpPeriod}%`
const landing = `${(100 * jumpDuration) / jumpPeriod}%`

/**
 * A jump: bigger, then back to its size and a rest before the next one. Eased at both ends of the way up, so the
 * item slows down at the top, which the turn must not do: it is a keyframes of its own (see {@link spin}).
 */
const jump = keyframes`
  0% {
    scale: 1;
    animation-timing-function: ease-out;
  }
  ${top} {
    scale: 1.5;
    animation-timing-function: ease-in;
  }
  ${landing}, 100% {
    scale: 1;
  }
`

/**
 * One clockwise turn during the jump, in one go: eased at its start and its end only, so it never stops half way
 * round, upside down, where the jump reaches its top.
 */
const spin = keyframes`
  0% {
    rotate: 0deg;
    animation-timing-function: ease-in-out;
  }
  ${landing}, 100% {
    rotate: 360deg;
  }
`

/**
 * The jump towards the player as well, for the cards and the Shark tokens: they lie on the grid, between tiles and
 * cards of their own height, which a lift keeps them clear of. The row of Military Victory tokens has nothing
 * around it to clear, and stays on the table.
 */
const lift = keyframes`
  0% {
    translate: 0 0 0;
    animation-timing-function: ease-out;
  }
  ${top} {
    translate: 0 0 2em;
    animation-timing-function: ease-in;
  }
  ${landing}, 100% {
    translate: 0 0 0;
  }
`

/** The seconds between the jumps of 2 items next to each other, so a row reads as a wave rather than a block. */
const jumpStagger = 0.12

/**
 * On the wrapper MaterialComponent puts around the faces, and not on the item: the item carries the transform that
 * places it on the table, which an animated one would replace. The wrapper only ever carries the hover, which a
 * game over has no use for on these items.
 */
const jumpingCss = (delay: number, lifted: boolean) =>
  lifted
    ? css`
        > * {
          animation:
            ${jump} ${jumpPeriod}s ${delay}s infinite,
            ${spin} ${jumpPeriod}s ${delay}s infinite,
            ${lift} ${jumpPeriod}s ${delay}s infinite;
        }
      `
    : css`
        > * {
          animation:
            ${jump} ${jumpPeriod}s ${delay}s infinite,
            ${spin} ${jumpPeriod}s ${delay}s infinite;
        }
      `
