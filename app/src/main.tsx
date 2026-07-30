import { LedaOptionsSpec } from '@gamepark/leda/LedaOptions'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LedaSetup } from '@gamepark/leda/LedaSetup'
import { GameProvider } from '@gamepark/react-game'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { gameAnimations } from './animations/GameAnimations'
import { App } from './App'
import { Locators } from './locators/Locators'
import { Material } from './material/Material'
import { ledaTheme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider
      game="leda"
      Rules={LedaRules}
      optionsSpec={LedaOptionsSpec}
      GameSetup={LedaSetup}
      material={Material}
      locators={Locators}
      animations={gameAnimations}
      theme={ledaTheme}
    >
      <App />
    </GameProvider>
  </StrictMode>
)
