import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Users, ChevronRight, ArrowLeft } from 'lucide-react'

interface SetupScreenProps {
  onLaunch: (difficulty: string, players: string) => void
  onBack: () => void
}

export default function SetupScreen({ onLaunch, onBack }: SetupScreenProps) {
  const [difficulty, setDifficulty] = useState('Veteran')
  const [playerCount, setPlayerCount] = useState('1P vs AI')

  const difficulties = [
    { name: 'Recruit', desc: 'High margin for error. Zero casualties likely.' },
    { name: 'Veteran', desc: 'Moderate risk. Standard strategic evaluation.' },
    { name: 'Commander', desc: 'High risk. Even perfect strategies incur cost.' },
    { name: 'Starfighter', desc: 'Nightmare. Survival is not guaranteed.' }
  ]

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

      <div className="glass-panel p-10 rounded-xl w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Difficulty */}
        <div>
          <h2 className="text-[#32ff64] uppercase tracking-widest text-sm flex items-center gap-2 mb-6 border-b border-[#32ff64]/20 pb-2">
            <ShieldAlert className="w-4 h-4" /> Threat Assessment
          </h2>
          <div className="space-y-4">
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

        {/* Right Column: Settings & Launch */}
        <div className="flex flex-col">
          <h2 className="text-[#32ff64] uppercase tracking-widest text-sm flex items-center gap-2 mb-6 border-b border-[#32ff64]/20 pb-2">
            <Users className="w-4 h-4" /> Combatants
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-auto">
            {['1P vs AI', '1v1 Local'].map(mode => (
              <button
                key={mode}
                onClick={() => setPlayerCount(mode)}
                className={`p-4 border text-center font-bold uppercase text-sm transition-all ${
                  playerCount === mode 
                    ? 'border-[#32ff64] bg-[#32ff64]/10 text-white' 
                    : 'border-gray-800 text-gray-500 hover:border-gray-600 bg-black/40'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="mt-12 bg-black/50 p-6 border border-gray-800 rounded">
            <div className="text-xs text-gray-500 mb-4 uppercase tracking-wider">Deployment Summary</div>
            <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
              <span className="text-gray-400">Target Area:</span>
              <span className="text-white">Aegis-7 Orbital Shipyard</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
              <span className="text-gray-400">Forces:</span>
              <span className="text-white">20x Vanguard Drones</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Threat Level:</span>
              <span className="text-[#ff3232]">{difficulty}</span>
            </div>
          </div>

          <motion.button
            onClick={() => onLaunch(difficulty, playerCount)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="tech-button w-full py-4 mt-6 flex items-center justify-center gap-2"
          >
            Launch Vanguard <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
