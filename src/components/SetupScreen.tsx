import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Users, ChevronRight, ArrowLeft, Crosshair, Loader2, RefreshCw } from 'lucide-react'
import { DEFAULTS } from '../constants'
import allScenarios from '../data/scenarios.json'

export interface Scenario {
  title: string
  type: string
  description: string
  droneCount: number
  modules: string[]
}

interface SetupScreenProps {
  onLaunch: (difficulty: string, players: string, scenario: Scenario) => void
  onBack: () => void
}

function pickRandom(pool: Scenario[], count: number): Scenario[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export default function SetupScreen({ onLaunch, onBack }: SetupScreenProps) {
  const [difficulty, setDifficulty] = useState(DEFAULTS.difficulty)
  const [playerCount, setPlayerCount] = useState(DEFAULTS.playerCount)
  const [scenarios, setScenarios] = useState<Scenario[]>(() => pickRandom(allScenarios, 3))
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null)
  const [loadingScenarios, setLoadingScenarios] = useState(false)
  const [scenarioError, setScenarioError] = useState(false)
  const [hasRegenerated, setHasRegenerated] = useState(false)

  const difficulties = [
    { name: 'Recruit', desc: 'High margin for error. Zero casualties likely.' },
    { name: 'Veteran', desc: 'Moderate risk. Standard strategic evaluation.' },
    { name: 'Commander', desc: 'High risk. Even perfect strategies incur cost.' },
    { name: 'Starfighter', desc: 'Nightmare. Survival is not guaranteed.' }
  ]

  const modes = [
    { name: '1P vs AI', enabled: true },
    { name: '1v1 Local', enabled: false },
  ]

  const regenerateScenarios = async () => {
    if (hasRegenerated) return
    setLoadingScenarios(true)
    setScenarioError(false)
    setSelectedScenario(null)
    try {
      const res = await fetch('/.netlify/functions/generate-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setScenarios(data.scenarios || [])
      setHasRegenerated(true)
    } catch {
      setScenarioError(true)
    } finally {
      setLoadingScenarios(false)
    }
  }

  // Suppress the unused variable warning — kept for potential future use
  useEffect(() => { void 0 }, [])

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="w-full min-h-screen flex items-center justify-center bg-[#050505] p-6 py-20 relative overflow-y-auto"
    >
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Abort Setup
      </button>

      <div className="w-full max-w-6xl space-y-8">
        {/* Top Row: Difficulty + Player Mode */}
        <div className="glass-panel p-8 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column: Difficulty */}
          <div>
            <h2 className="text-[#32ff64] uppercase tracking-widest text-sm flex items-center gap-2 mb-6 border-b border-[#32ff64]/20 pb-2">
              <ShieldAlert className="w-4 h-4" /> Threat Assessment
            </h2>
            <div className="space-y-3">
              {difficulties.map(diff => (
                <button
                  key={diff.name}
                  onClick={() => setDifficulty(diff.name)}
                  className={`w-full text-left p-4 border transition-all ${
                    difficulty === diff.name 
                      ? 'border-[#32ff64] bg-[#32ff64]/10 shadow-[0_0_15px_rgba(50,255,100,0.1)]' 
                      : 'border-gray-800 hover:border-gray-600 bg-black/40'
                  }`}
                >
                  <div className="font-bold text-lg uppercase mb-1 text-gray-200">{diff.name}</div>
                  <div className="text-xs text-gray-500">{diff.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Player Mode */}
          <div className="flex flex-col">
            <h2 className="text-[#32ff64] uppercase tracking-widest text-sm flex items-center gap-2 mb-6 border-b border-[#32ff64]/20 pb-2">
              <Users className="w-4 h-4" /> Combatants
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {modes.map(mode => (
                <button
                  key={mode.name}
                  onClick={() => mode.enabled && setPlayerCount(mode.name)}
                  disabled={!mode.enabled}
                  className={`p-4 border text-center font-bold uppercase text-sm transition-all relative ${
                    !mode.enabled
                      ? 'border-gray-800 text-gray-700 bg-black/40 cursor-not-allowed opacity-50'
                      : playerCount === mode.name 
                        ? 'border-[#32ff64] bg-[#32ff64]/10 text-white' 
                        : 'border-gray-800 text-gray-500 hover:border-gray-600 bg-black/40'
                  }`}
                >
                  {mode.name}
                  {!mode.enabled && (
                    <span className="block text-[10px] text-gray-600 mt-1 normal-case tracking-normal">Coming Soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Scenario Selection */}
        <div className="glass-panel p-8 rounded-xl">
          <div className="flex items-center justify-between mb-6 border-b border-[#32ff64]/20 pb-2">
            <h2 className="text-[#32ff64] uppercase tracking-widest text-sm flex items-center gap-2">
              <Crosshair className="w-4 h-4" /> Select Mission
            </h2>
            <button
              onClick={regenerateScenarios}
              disabled={loadingScenarios || hasRegenerated}
              className="text-gray-500 hover:text-[#32ff64] transition-colors flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3 h-3 ${loadingScenarios ? 'animate-spin' : ''}`} /> 
              {hasRegenerated ? 'Regeneration Used' : 'Regenerate (1 Remaining)'}
            </button>
          </div>

          {loadingScenarios && (
            <div className="flex items-center justify-center py-16 text-[#32ff64]">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              <span className="font-mono text-sm">Generating combat scenarios...</span>
            </div>
          )}

          {scenarioError && (
            <div className="text-center py-16">
              <p className="text-red-400 font-mono text-sm mb-4">Failed to generate scenarios. Check API key configuration.</p>
              <button onClick={regenerateScenarios} className="tech-button px-6 py-2 text-sm">Retry</button>
            </div>
          )}

          {!loadingScenarios && !scenarioError && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedScenario(i)}
                  className={`text-left p-5 border transition-all rounded-lg flex flex-col ${
                    selectedScenario === i
                      ? 'border-[#32ff64] bg-[#32ff64]/10 shadow-[0_0_20px_rgba(50,255,100,0.1)]'
                      : 'border-gray-800 hover:border-gray-600 bg-black/40'
                  }`}
                >
                  <span className="text-[10px] text-[#32ff64] uppercase tracking-widest mb-2 opacity-70">
                    {scenario.type}
                  </span>
                  <h3 className="font-bold text-white text-lg uppercase mb-3">{scenario.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 flex-1">{scenario.description}</p>
                  <div className="border-t border-gray-800 pt-3 mt-auto">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">Forces:</span>
                      <span className="text-white">{scenario.droneCount}x Drones</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {scenario.modules.map((mod, j) => (
                        <span key={j} className="text-[9px] px-2 py-0.5 border border-gray-700 bg-black/60 text-gray-400 rounded">
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Launch Button */}
        <div className="flex justify-center">
          <motion.button
            onClick={() => {
              if (selectedScenario !== null && scenarios[selectedScenario]) {
                onLaunch(difficulty, playerCount, scenarios[selectedScenario])
              }
            }}
            disabled={selectedScenario === null}
            whileHover={selectedScenario !== null ? { scale: 1.02 } : {}}
            whileTap={selectedScenario !== null ? { scale: 0.98 } : {}}
            className="tech-button w-full max-w-md py-4 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Launch Vanguard <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
