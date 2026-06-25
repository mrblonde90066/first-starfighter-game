import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './components/LandingPage'
import SetupScreen from './components/SetupScreen'
import type { Scenario } from './components/SetupScreen'
import GameHUD from './components/GameHUD'
import { DEFAULTS } from './constants'

export type AppState = 'landing' | 'setup' | 'playing'

function App() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [difficulty, setDifficulty] = useState<string>(DEFAULTS.difficulty)
  const [playerCount, setPlayerCount] = useState<string>(DEFAULTS.playerCount)
  const [scenario, setScenario] = useState<Scenario | null>(null)

  return (
    <div className="min-h-screen w-full bg-[#050505] text-gray-200 relative overflow-hidden font-sans">
      <div className="scanline" />
      
      <AnimatePresence mode="wait">
        {appState === 'landing' && (
          <LandingPage key="landing" onStart={() => setAppState('setup')} />
        )}
        
        {appState === 'setup' && (
          <SetupScreen 
            key="setup"
            onLaunch={(diff, players, sc) => {
              setDifficulty(diff)
              setPlayerCount(players)
              setScenario(sc)
              setAppState('playing')
            }} 
            onBack={() => setAppState('landing')}
          />
        )}
        
        {appState === 'playing' && scenario && (
          <GameHUD 
            key="playing"
            difficulty={difficulty}
            playerCount={playerCount}
            scenario={scenario}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
