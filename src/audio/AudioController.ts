export class AudioController {
  private ctx: AudioContext | null = null;
  private isPlaying = false;

  public init() {
    if (this.isPlaying) return;
    
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
      
      // 1. Deep Sub Bass Oscillator
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(40, this.ctx.currentTime); // Very deep
      
      // 2. Dissonant Sawtooth for texture (HR Giger mechanical feel)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(42, this.ctx.currentTime);
      
      // 3. Lowpass Filter (muffles the harshness, makes it dark/ambient)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, this.ctx.currentTime);
      
      // 4. LFO (Low Frequency Oscillator) to modulate the filter (creates a breathing/pulsing drone)
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.05, this.ctx.currentTime); // Very slow 20-second pulse
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      // 5. Delay Node for echoes
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.5; // Half second delay
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.4; // Feedback loop
      
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      
      // 6. Master Volume
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime); // Keep it quiet and atmospheric
      
      // Routing
      osc1.connect(masterGain);
      osc2.connect(filter);
      filter.connect(masterGain);
      
      // Route through delay for that echo/reverb feel
      masterGain.connect(delay);
      delay.connect(this.ctx.destination);
      masterGain.connect(this.ctx.destination);
      
      // Start the drone
      osc1.start();
      osc2.start();
      lfo.start();
      
      this.isPlaying = true;
    } catch (e) {
      console.warn("AudioContext failed to start", e);
    }
  }
}

export const darkAmbientAudio = new AudioController();
