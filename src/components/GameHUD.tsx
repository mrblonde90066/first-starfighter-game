import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Map, Activity, Radio, Loader2 } from 'lucide-react'
import type { Scenario } from './SetupScreen'
import { darkAmbientAudio } from '../audio/AudioController'

interface GameHUDProps {
  difficulty: string
  playerCount: string
  playstyle: string
  scenario: Scenario
  isFairyMode: boolean
  onEndGame: () => void
}

interface LogEntry {
  sender: 'GM' | 'Player'
  text: string
  timestamp: string
}

export default function GameHUD({ difficulty, playerCount, playstyle, scenario, isFairyMode, onEndGame }: GameHUDProps) {
  const [strategy, setStrategy] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [missionResult, setMissionResult] = useState<'ongoing' | 'victory' | 'defeat'>('ongoing')
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      sender: 'GM',
      text: `INITIATING UPLINK...\nCONNECTION ESTABLISHED.\n\n[MISSION: ${scenario.title.toUpperCase()}]\nType: ${scenario.type}\n\n${scenario.description}\n\nYou have ${scenario.droneCount} Vanguard drones holding at the perimeter.\n\n[SYSTEM CALIBRATION - HOW TO PLAY]\nFirst Starfighter uses a fluid strategy system. Describe your broad-strokes tactical plan rather than issuing simple commands. Tell me how you want to deploy your units and what Active Modules you want to utilize.\n\n[HOW OUTCOMES ARE DETERMINED]\nYour strategy is evaluated against the battlefield conditions. Smart tactical choices earn positive modifiers; poor ones earn penalties. A virtual d20 is rolled and your modifier is applied. The result determines how well your plan succeeds — or how badly it fails. Higher difficulty settings reduce your modifiers and increase enemy response.\n\nEXAMPLE: 'I want to send 5 drones using ${scenario.modules[0]} to scout the perimeter. The remaining ${scenario.droneCount - 5} will hold back and prepare ${scenario.modules[2]} for a breach if the scouts are compromised.'\n\nAwaiting your strategic directives, Commander.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const prevLogsLengthRef = useRef(1)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (logs.length > 1 && logs.length > prevLogsLengthRef.current) {
      setTimeout(() => {
        const newMessage = document.getElementById(`log-${logs.length - 1}`)
        newMessage?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      prevLogsLengthRef.current = logs.length
    }
  }, [logs])

  useEffect(() => {
    if (missionResult === 'victory') {
      darkAmbientAudio.playVictorySound()
    } else if (missionResult === 'defeat') {
      darkAmbientAudio.playDefeatSound()
    }
  }, [missionResult])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!strategy.trim() || isLoading) return

    const playerMessage = strategy
    setStrategy('')

    setLogs(prev => [...prev, {
      sender: 'Player',
      text: playerMessage,
      timestamp: new Date().toLocaleTimeString()
    }])

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: playerMessage }
    ]
    setConversationHistory(updatedHistory)

    setIsLoading(true)
    try {
      const response = await fetch('/.netlify/functions/game-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: playerMessage,
          difficulty,
          playerCount,
          playstyle,
          scenario,
          isFairyMode,
          conversationHistory: updatedHistory,
        }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      let gmText = data.response || 'Signal lost. Attempting reconnection...'

      // Parse for Win/Loss tags
      if (gmText.includes('[MISSION_STATUS: VICTORY]')) {
        setMissionResult('victory')
        gmText = gmText.replace('[MISSION_STATUS: VICTORY]', '').trim()
      } else if (gmText.includes('[MISSION_STATUS: DEFEAT]')) {
        setMissionResult('defeat')
        gmText = gmText.replace('[MISSION_STATUS: DEFEAT]', '').trim()
      }

      setLogs(prev => [...prev, {
        sender: 'GM',
        text: gmText,
        timestamp: new Date().toLocaleTimeString()
      }])

      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: gmText }
      ])
    } catch (err) {
      console.error('GM API error:', err)
      setLogs(prev => [...prev, {
        sender: 'GM',
        text: '[COMM ERROR] Unable to reach AI Game Master. Check your connection and try again.',
        timestamp: new Date().toLocaleTimeString()
      }])
    } finally {
      setIsLoading(false)
    }
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
          <span className="text-gray-500">{scenario.title.toUpperCase()}</span>
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
              id={`log-${i}`}
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
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start"
            >
              <span className="text-[10px] mb-1 opacity-50 text-[#32ff64]">
                AI GAME MASTER
              </span>
              <div className="p-4 rounded border bg-black/60 border-[#32ff64]/30 text-[#32ff64] flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Transmitting... Analyzing strategic parameters...
              </div>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-black/80 border-t border-[#32ff64]/20 flex gap-4">
          <input 
            type="text"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder={missionResult !== 'ongoing' ? "Mission concluded." : "Enter fluid strategic directives..."}
            disabled={isLoading || missionResult !== 'ongoing'}
            className="flex-1 bg-black/50 border border-gray-700 rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#32ff64]/50 transition-colors disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isLoading || missionResult !== 'ongoing'}
            className="tech-button px-6 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
              <span className="text-4xl font-black text-white">
                {missionResult === 'defeat' ? '0' : scenario.droneCount}<span className="text-lg text-gray-600">/{scenario.droneCount}</span>
              </span>
              <span className={`text-xs mb-1 uppercase ${missionResult === 'defeat' ? 'text-red-500' : 'text-[#32ff64]'}`}>
                {missionResult === 'defeat' ? 'CRITICAL' : 'Optimal'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Parameters</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-red-900/10 border border-red-500/20 rounded text-red-400 font-bold uppercase text-center text-sm">
                {difficulty}
              </div>
              <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded text-blue-400 font-bold uppercase text-center text-sm">
                {playstyle}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Active Modules</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {scenario.modules.map((mod, i) => (
                <div key={i} className="p-2 border border-gray-800 bg-black/40 text-gray-400 text-center rounded">
                  {mod}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* End Screen Overlay */}
      <AnimatePresence>
        {missionResult !== 'ongoing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <div className={`p-10 max-w-2xl w-full text-center border-y-4 ${missionResult === 'victory' ? 'border-[#32ff64] shadow-[0_0_100px_rgba(50,255,100,0.2)]' : 'border-red-600 shadow-[0_0_100px_rgba(220,38,38,0.2)]'}`}>
              <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-5xl font-black tracking-widest uppercase mb-6 ${missionResult === 'victory' ? 'text-[#32ff64]' : 'text-red-500'}`}
              >
                {missionResult === 'victory' ? 'Mission Accomplished' : 'Squadron Lost'}
              </motion.h1>
              
              <p className="text-gray-400 text-lg mb-10">
                {missionResult === 'victory' 
                  ? 'Objective secured. Awaiting extraction...' 
                  : 'Total catastrophic failure. Signal terminated.'}
              </p>

              <button 
                onClick={onEndGame}
                className={`px-8 py-4 font-bold tracking-widest uppercase border transition-colors ${
                  missionResult === 'victory'
                    ? 'border-[#32ff64] text-[#32ff64] hover:bg-[#32ff64]/20'
                    : 'border-red-500 text-red-500 hover:bg-red-500/20'
                }`}
              >
                Return to Base
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
