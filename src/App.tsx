import { useState } from 'react'
import LandingPage from './components/LandingPage'
import SetupScreen from './components/SetupScreen'
import GameHUD from './components/GameHUD'

export type AppState = 'landing' | 'setup' | 'playing'

function App() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [difficulty, setDifficulty] = useState<string>('Veteran')
  const [playerCount, setPlayerCount] = useState<string>('1P vs AI')

  return (
    <div className="min-h-screen w-full bg-[#050505] text-gray-200 relative overflow-hidden font-sans">
      <div className="scanline" />
      
      {appState === 'landing' && (
        <LandingPage onStart={() => setAppState('setup')} />
      )}
      
      {appState === 'setup' && (
        <SetupScreen 
          onLaunch={(diff, players) => {
            setDifficulty(diff)
            setPlayerCount(players)
            setAppState('playing')
          }} 
          onBack={() => setAppState('landing')}
        />
      )}
      
      {appState === 'playing' && (
        <GameHUD 
          difficulty={difficulty}
          playerCount={playerCount}
        />
      )}
    </div>
  )
}

export default App
