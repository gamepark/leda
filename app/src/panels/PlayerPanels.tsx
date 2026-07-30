import { css } from '@emotion/react'
import { StyledPlayerPanel, usePlayers } from '@gamepark/react-game'
import { createPortal } from 'react-dom'

export const PlayerPanels = () => {
  const players = usePlayers<number>({ sortFromMe: true })
  const root = document.getElementById('root')
  if (!root) {
    return null
  }

  return createPortal(
    <>
      {players.map((player, index) => (
        <StyledPlayerPanel key={player.id} player={player} css={[panelBackground, panelPosition(index)]} activeRing />
      ))}
    </>,
    root
  )
}

/**
 * The panels are white by default. This is the beige of the band at the bottom of the tiles, sampled on the artwork,
 * so that the panels sit in the same range of colors as the material rather than glaring over it.
 */
const panelBackground = css`
  background: #f0e4cc;
`

/**
 * The panels are at the bottom, under the grid of their owner. The player looking at the table is on the left, their
 * opponent on the right, which is the same order the locators place their material in (see Locators.playerSide).
 */
const panelPosition = (index: number) => css`
  position: absolute;
  bottom: 1em;
  ${index === 0 ? 'left: 1em;' : 'right: 1em;'}
  width: 28em;
`
