import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Map, Activity, Radio } from 'lucide-react'

interface GameHUDProps {
  difficulty: string
  playerCount: string
}

interface LogEntry {
  sender: 'GM' | 'Player'
  text: string
  timestamp: string
}

export default function GameHUD({ difficulty }: GameHUDProps) {
  const [strategy, setStrategy] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      sender: 'GM',
      text: "INITIATING UPLINK...\nCONNECTION ESTABLISHED.\n\nWelcome to Aegis-7 Orbital Shipyard. The facility is derelict, but intelligence suggests heavy automated defenses and enemy patrols. Your objective: Infiltrate, locate the Dreadnought construction bay, and sabotage production.\n\nYou have 20 Vanguard drones holding at the perimeter.\n\n[SYSTEM CALIBRATION - HOW TO PLAY]\nFirst Starfighter uses a fluid strategy system. Describe your broad-strokes tactical plan rather than issuing simple commands. Tell me how you want to deploy your units and what Active Modules (listed on the right) you want to utilize.\n\nEXAMPLE: 'I want to send 5 drones using Optical Camo to scout the main corridor. The remaining 15 will hold back and prepare Depth Charges for a breach if the scouts are compromised.'\n\nAwaiting your strategic directives for the infiltration phase. How do we proceed, Commander?",
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!strategy.trim()) return

    // Add player input to log
    setLogs(prev => [...prev, {
      sender: 'Player',
      text: strategy,
      timestamp: new Date().toLocaleTimeString()
    }])

    // Mock GM Response
    setTimeout(() => {
      setLogs(prev => [...prev, {
        sender: 'GM',
        text: `Strategy locked. Analyzing threat matrix based on [${difficulty}] parameters... \n\nVirtual Dice Roll: 14 + Modifiers (+2). Result: 16 (Success with Minor Cost).\n\nYour drones execute the maneuver. The infiltration is mostly successful, but an unexpected plasma vent flare damages the armor on two units. They are pushing forward to the central bay.`,
        timestamp: new Date().toLocaleTimeString()
      }])
    }, 1500)

    setStrategy('')
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen lg:h-screen grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-[#0a0a0f] overflow-y-auto lg:overflow-hidden"
    >
      {/* Left Panel: Map */}
      <div className="col-span-1 lg:col-span-3 glass-panel rounded-lg flex flex-col overflow-hidden min-h-[300px] lg:min-h-0 order-3 lg:order-none">
        <div className="bg-black/80 px-4 py-2 border-b border-[#32ff64]/20 flex items-center justify-between text-xs">
          <span className="text-[#32ff64] flex items-center gap-2"><Map className="w-3 h-3"/> TACTICAL OVERLAY</span>
          <span className="text-gray-500">AEGIS-7</span>
        </div>
        <div className="flex-1 bg-black/40 p-2 relative">
          <img src="/assets/map.png" alt="Tactical Map" className="w-full h-full object-cover rounded opacity-80 border border-[#32ff64]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Center Panel: Console */}
      <div className="col-span-1 lg:col-span-6 glass-panel rounded-lg flex flex-col overflow-hidden h-[60vh] lg:h-auto order-1 lg:order-none">
        <div className="bg-black/80 px-4 py-2 border-b border-[#32ff64]/20 flex items-center justify-between text-xs">
          <span className="text-[#32ff64] flex items-center gap-2"><Radio className="w-3 h-3"/> COMMAND FEED</span>
          <span className="text-gray-500">SECURE CHANNEL</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-800">
          {logs.map((log, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex flex-col ${log.sender === 'Player' ? 'items-end' : 'items-start'}`}
            >
              <span className={`text-[10px] mb-1 opacity-50 ${log.sender === 'Player' ? 'text-blue-400' : 'text-[#32ff64]'}`}>
                {log.sender === 'Player' ? 'SUPREME COMMANDER' : 'AI GAME MASTER'} // {log.timestamp}
              </span>
              <div className={`p-4 rounded border whitespace-pre-wrap max-w-[85%] ${
                log.sender === 'Player' 
                  ? 'bg-blue-900/20 border-blue-500/30 text-blue-100' 
                  : 'bg-black/60 border-[#32ff64]/30 text-gray-300'
              }`}>
                {log.text}
              </div>
            </motion.div>
          ))}
          <div ref={logsEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-black/80 border-t border-[#32ff64]/20 flex gap-4">
          <input 
            type="text"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="Enter fluid strategic directives..."
            className="flex-1 bg-black/50 border border-gray-700 rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#32ff64]/50 transition-colors"
          />
          <button type="submit" className="tech-button px-6 rounded flex items-center justify-center">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Right Panel: Status */}
      <div className="col-span-1 lg:col-span-3 glass-panel rounded-lg flex flex-col overflow-hidden order-2 lg:order-none">
        <div className="bg-black/80 px-4 py-2 border-b border-[#32ff64]/20 flex items-center justify-between text-xs">
          <span className="text-[#32ff64] flex items-center gap-2"><Activity className="w-3 h-3"/> SQUADRON STATUS</span>
        </div>
        <div className="p-4 space-y-6">
          
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Combat Readiness</div>
            <div className="flex items-end justify-between border-b border-gray-800 pb-2">
              <span className="text-4xl font-black text-white">20<span className="text-lg text-gray-600">/20</span></span>
              <span className="text-[#32ff64] text-xs mb-1 uppercase">Optimal</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Threat Level</div>
            <div className="p-3 bg-red-900/10 border border-red-500/20 rounded text-red-400 font-bold uppercase text-center text-sm">
              {difficulty}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Active Modules</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 border border-gray-800 bg-black/40 text-gray-400 text-center rounded">OPTICAL CAMO</div>
              <div className="p-2 border border-gray-800 bg-black/40 text-gray-400 text-center rounded">ICE BREAKERS</div>
              <div className="p-2 border border-gray-800 bg-black/40 text-gray-400 text-center rounded">DEPTH CHARGES</div>
              <div className="p-2 border border-gray-800 bg-black/40 text-gray-400 text-center rounded">THRUSTERS</div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  )
}
