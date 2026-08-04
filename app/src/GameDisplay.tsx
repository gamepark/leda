import { pointerWithin } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { DevToolsHub, GameTable, GameTableNavigation } from '@gamepark/react-game'
import { tableXMax } from './locators/Locators'
import { PlayerPanels } from './panels/PlayerPanels'

export function GameDisplay() {
  // The top margin leaves room for the header. Each player has their grid at the top and their panel at the bottom
  // left or bottom right corner, over the bottom band of the table where their Food and Military Victory tokens are.
  const margin = { top: 7, left: 0, right: 0, bottom: 0 }
  return (
    // The width of the table is what the layout needs (see tableXMax), not a round number picked here.
    <GameTable xMin={-tableXMax} xMax={tableXMax} yMin={-22} yMax={17} margin={margin}
               collisionAlgorithm={pointerWithin}
               css={process.env.NODE_ENV === 'development' && tableBorder}>
      <GameTableNavigation css={navigation} />
      <PlayerPanels />
      {process.env.NODE_ENV === 'development' && <DevToolsHub fabBottom="calc(5em)" />}
    </GameTable>
  )
}

/**
 * Zoom buttons, at the bottom center of the screen instead of the top left corner, where the player panel is.
 * This css is merged with the one of the component, which anchors the buttons to `top: 8em; left: 1em`, hence the
 * explicit `top: auto`: without it the top anchor wins over the bottom one.
 */
const navigation = css`
  top: auto;
  bottom: 1em;
  left: 50%;
  transform: translateX(-50%) translateZ(100em);
`

const tableBorder = css`
  border: 1px solid white;
`
