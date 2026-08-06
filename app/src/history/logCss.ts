import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { clanColors, clanGold } from '../theme'

/**
 * What tells whose log entry it is, beyond the name written in it: the colour of the clan its player took, with the
 * gold rule their cards and their panel are framed with (see {@link PlayerPanels}).
 *
 * The colours of the clans are the ones of their card backs, which are bright enough that the white text of a log
 * would not read over them: they are mixed towards black here rather than picked a second time, so that a clan
 * whose colour is corrected keeps a log entry that matches its panel.
 * Undefined while a player has no clan, which is only true of the setup: the entry keeps the dark background the
 * framework gives it.
 */
export const clanLogCss = (clan?: Clan) => {
  if (clan === undefined) return undefined
  return css`
    background-color: ${darken(clanColors[clan], logColorRatio)};
    box-shadow: inset 0 0 0 0.1em ${clanGold};
    color: white;
  `
}

/** How much of the colour of the clan is left once it is mixed with black, low enough for white text to read over. */
const logColorRatio = 0.45

const darken = (color: string, ratio: number): string => {
  const value = parseInt(color.slice(1), 16)
  const channel = (shift: number) => Math.round(((value >> shift) & 0xff) * ratio)
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}
