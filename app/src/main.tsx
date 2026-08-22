import { LedaOptionsSpecV2 } from '@gamepark/leda/LedaOptions'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LedaSetup } from '@gamepark/leda/LedaSetup'
import { GameProvider } from '@gamepark/react-game'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { gameAnimations } from './animations/GameAnimations'
import { App } from './App'
import { LedaHistory } from './history/LedaHistory'
import { Locators } from './locators/Locators'
import { Material } from './material/Material'
import { LedaScoring } from './result/LedaScoring'
import { ledaTheme } from './theme'
import { LedaTutorial } from './tutorial/LedaTutorial'
import { ai } from './tutorial/TutorialAI'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider
      game="leda"
      Rules={LedaRules}
      optionsSpec={LedaOptionsSpecV2}
      GameSetup={LedaSetup}
      material={Material}
      locators={Locators}
      animations={gameAnimations}
      logs={new LedaHistory()}
      scoring={new LedaScoring()}
      tutorial={new LedaTutorial()}
      ai={ai}
      theme={ledaTheme}
    >
      <App />
    </GameProvider>
  </StrictMode>
)
