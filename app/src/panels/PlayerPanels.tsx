import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { StyledPlayerPanel, usePlayers, useRules } from '@gamepark/react-game'
import { createPortal } from 'react-dom'
import { clanColors, clanGold } from '../theme'

export const PlayerPanels = () => {
  const players = usePlayers<number>({ sortFromMe: true })
  const rules = useRules<LedaRules>()
  const root = document.getElementById('root')
  if (!root) {
    return null
  }

  /** A player has a clan as soon as they took its Victory condition card, which is what the choice creates. */
  const getClan = (player: number): Clan | undefined => rules?.material(MaterialType.VictoryConditionCard).player(player).getItem()?.id

  return createPortal(
    <>
      {players.map((player, index) => (
        <StyledPlayerPanel
          key={player.id}
          player={player}
          css={[panelPosition(index), clanPanel(getClan(player.id))]}
          activeRing
        />
      ))}
    </>,
    root
  )
}

/**
 * Once a player picked a clan, their panel takes the color of that clan, with the gold rule its cards are framed
 * with. Before that it keeps the parchment of the theme. The name and the timer are white on a dark badge, so they
 * stay readable over any of the 3 clan colors.
 */
const clanPanel = (clan?: Clan) => {
  const color = clan !== undefined ? clanColors[clan] : undefined
  if (!color) return undefined
  return css`
    background: ${color};
    box-shadow: inset 0 0 0 0.15em ${clanGold};
  `
}

/**
 * The panels are at the bottom, under the grid of their owner. The player looking at the table is on the left, their
 * opponent on the right, which is the same order the locators place their material in (see Locators.playerSide).
 */
const panelPosition = (index: number) => css`
  position: absolute;
  bottom: 2em;
  ${index === 0 ? 'left: 2em;' : 'right: 2em;'}
  width: 28em;
`
