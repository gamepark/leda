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
        <div key={player.id} css={panelPosition(index)}>
          <StyledPlayerPanel player={player} css={[panel, clanPanel(getClan(player.id))]} activeRing />
        </div>
      ))}
    </>,
    root
  )
}

/**
 * The panel is what its own content is placed against: the avatar of its owner hangs out of its top left corner,
 * and anything absolute inside it is anchored to the closest positioned ancestor.
 */
const panel = css`
  position: relative;
`

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
 *
 * A panel is anchored to the bottom rather than sized here: how tall it is belongs to the framework, and reading it
 * here would be one more thing to keep in step. Anything the panel is stacked with grows upwards from there, and
 * the panel itself never moves.
 */
const panelPosition = (index: number) => css`
  position: absolute;
  bottom: 2em;
  ${index === 0 ? 'left: 2em;' : 'right: 2em;'}
  width: 28em;
  display: flex;
  flex-direction: column;
  align-items: ${index === 0 ? 'flex-start' : 'flex-end'};
  gap: 3em;
`
