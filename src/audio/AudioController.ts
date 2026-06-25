export class AudioController {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private oscillators: OscillatorNode[] = [];
  private masterGain: GainNode | null = null;

  public init() {
    if (this.isPlaying) return;
    
    try {
      // Create audio context with Safari/iOS fallback
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      
      // Defensive resume for Safari/iOS suspended contexts
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
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
      delayFeedback.gain.value = 0.3; // Reduced from 0.4 to prevent energy accumulation
      
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      
      // 6. Master Volume
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      
      // Routing
      osc1.connect(this.masterGain);
      osc2.connect(filter);
      filter.connect(this.masterGain);
      
      // Route through delay for that echo/reverb feel
      this.masterGain.connect(delay);
      delay.connect(this.ctx.destination);
      this.masterGain.connect(this.ctx.destination);
      
      // Start the drone and store references for cleanup
      osc1.start();
      osc2.start();
      lfo.start();
      this.oscillators = [osc1, osc2, lfo];
      
      this.isPlaying = true;
    } catch (e) {
      console.warn("AudioContext failed to start", e);
    }
  }

  public stop() {
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    this.oscillators = [];
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.isPlaying = false;
  }

  public mute() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public unmute() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    }
  }
}

export const darkAmbientAudio = new AudioController();
