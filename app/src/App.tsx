import { css } from '@emotion/react'
import {
  FailuresDialog,
  FullscreenDialog,
  LiveLogContainer,
  LoadingScreen,
  MaterialGameSounds,
  MaterialHeader,
  MaterialImageLoader,
  Menu,
  useGame
} from '@gamepark/react-game'
import { MaterialGame } from '@gamepark/rules-api'
import { useEffect, useState } from 'react'
import { GameDisplay } from './GameDisplay'
import { Headers } from './headers/Headers'
import { MilitarySymbolSound } from './sounds/MilitarySymbolSound'

export function App() {
  const game = useGame<MaterialGame>()
  const [isJustDisplayed, setJustDisplayed] = useState(true)
  const [isImagesLoading, setImagesLoading] = useState(true)
  useEffect(() => {
    setTimeout(() => setJustDisplayed(false), process.env.NODE_ENV === 'development' ? 0 : 2000)
  }, [])
  const loading = !game || isJustDisplayed || isImagesLoading
  return (
    <>
      {!!game && <GameDisplay />}
      <LoadingScreen display={loading} />
      <MaterialHeader rulesStepsHeaders={Headers} loading={loading} />
      <MaterialImageLoader onImagesLoad={() => setImagesLoading(false)} />
      <MaterialGameSounds />
      <MilitarySymbolSound />
      <Menu />
      <FailuresDialog />
      <FullscreenDialog />
      {!loading && <LiveLogContainer css={liveLog} />}
    </>
  )
}

/**
 * The last entries of the journal, shown on the table as they are played. Under the header and against the right
 * edge, which is the one band of the screen nothing of the game is anchored to: the panels are at the bottom and
 * the zoom buttons between them. It never takes a click: what it says is read on the table underneath it.
 */
const liveLog = css`
  position: absolute;
  top: 8em;
  right: 1em;
  width: 40em;
  pointer-events: none;
`
