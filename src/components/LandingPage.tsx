import { motion } from 'framer-motion'
import { Terminal } from 'lucide-react'
import { darkAmbientAudio } from '../audio/AudioController'

interface LandingPageProps {
  onStart: () => void
}

export default function LandingPage({ onStart }: LandingPageProps) {
  
  const handleStart = (forceSeinfeld = false) => {
    // Start the generative dark ambient audio engine on first user interaction
    darkAmbientAudio.init(forceSeinfeld);
    onStart();
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="relative w-full h-screen flex flex-col items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
      
      {/* Secret Easter Egg Trigger: Robot Face Area */}
      <div 
        onClick={() => handleStart(true)}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[25%] z-20 cursor-default"
        title=""
      />
      
      <div className="relative z-10 text-center glass-panel p-6 md:p-12 rounded-2xl w-[90%] max-w-3xl">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <Terminal className="w-12 h-12 md:w-16 md:h-16 text-[#32ff64] mx-auto mb-4 md:mb-6 opacity-80" />
          <h1 className="text-4xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2 uppercase">
            First Starfighter
          </h1>
          <p className="text-[#32ff64] tracking-[0.1em] md:tracking-[0.3em] uppercase text-xs md:text-sm mb-8 md:mb-12 opacity-80">
            Supreme Command Uplink
          </p>
        </motion.div>

        <motion.button
          onClick={() => handleStart()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="tech-button px-12 py-4 text-lg rounded-sm"
        >
          Initialize Uplink
        </motion.button>
      </div>
    </motion.div>
  )
}
