export class AudioController {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private oscillators: OscillatorNode[] = [];
  private masterGain: GainNode | null = null;
  private loopTimer: number | null = null;
  public isSeinfeldMode = false;

  public init(forceSeinfeld = false) {
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

      // 10% chance of the Seinfeld easter egg, or 100% if forced
      if (forceSeinfeld || Math.random() < 0.1) {
        this.isSeinfeldMode = true;
        this.initSeinfeld();
      } else {
        this.isSeinfeldMode = false;
        this.initDarkAmbient();
      }
      
      this.isPlaying = true;
    } catch (e) {
      console.warn("AudioContext failed to start", e);
    }
  }

  private initDarkAmbient() {
    if (!this.ctx) return;

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
    delay.delayTime.value = 0.5;
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.value = 0.3;
    
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    
    // 6. Master Volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    
    // Routing
    osc1.connect(this.masterGain);
    osc2.connect(filter);
    filter.connect(this.masterGain);
    
    this.masterGain.connect(delay);
    delay.connect(this.ctx.destination);
    this.masterGain.connect(this.ctx.destination);
    
    // Start the drone and store references
    osc1.start();
    osc2.start();
    lfo.start();
    this.oscillators = [osc1, osc2, lfo];
  }

  private initSeinfeld() {
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Classic Seinfeld-style slap bass riff notes (frequencies in Hz)
    // Pattern inspired by the iconic bass lick: funky, syncopated, playful
    const riff = [
      { freq: 196.0, dur: 0.12, rest: 0.08 },  // G3 - pop
      { freq: 246.9, dur: 0.10, rest: 0.05 },  // B3 - slap
      { freq: 293.7, dur: 0.15, rest: 0.10 },  // D4 - thump
      { freq: 246.9, dur: 0.08, rest: 0.04 },  // B3 - quick
      { freq: 196.0, dur: 0.12, rest: 0.15 },  // G3 - pop
      { freq: 164.8, dur: 0.18, rest: 0.08 },  // E3 - low walk
      { freq: 196.0, dur: 0.10, rest: 0.05 },  // G3 - bounce
      { freq: 220.0, dur: 0.14, rest: 0.12 },  // A3 - lead into
      { freq: 246.9, dur: 0.20, rest: 0.30 },  // B3 - land and breathe
      { freq: 0,     dur: 0,    rest: 0.40 },   // pause
    ];

    const playRiff = () => {
      if (!this.ctx || !this.masterGain) return;
      // Allow the first iteration to run even if isPlaying hasn't been flipped yet
      // but stop subsequent iterations if it's been stopped
      if (this.loopTimer !== null && !this.isPlaying) return;

      let time = this.ctx.currentTime;

      for (const note of riff) {
        if (note.freq === 0) {
          time += note.rest;
          continue;
        }

        // Create a short, punchy bass note (slap bass timbre)
        const osc = this.ctx.createOscillator();
        osc.type = 'square'; // Bright, punchy
        osc.frequency.setValueAtTime(note.freq, time);

        // Sub oscillator for bass weight
        const sub = this.ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(note.freq / 2, time);

        // Envelope for the "slap" attack
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(0.6, time + 0.005); // Instant attack
        env.gain.exponentialRampToValueAtTime(0.01, time + note.dur); // Quick decay

        // Bandpass filter for that nasal, funky tone
        const bpf = this.ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(800, time);
        bpf.Q.setValueAtTime(2, time);

        // Route: osc -> filter -> envelope -> master
        osc.connect(bpf);
        bpf.connect(env);
        sub.connect(env);
        env.connect(this.masterGain);

        osc.start(time);
        sub.start(time);
        osc.stop(time + note.dur + 0.05);
        sub.stop(time + note.dur + 0.05);

        time += note.dur + note.rest;
      }

      // Schedule the next loop
      const riffDuration = riff.reduce((sum, n) => sum + n.dur + n.rest, 0);
      this.loopTimer = window.setTimeout(playRiff, riffDuration * 1000);
    };

    playRiff();
  }

  public stop() {
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    this.oscillators = [];
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
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

  public playDefeatSound() {
    this.stop(); // Stop the background loop

    // We must re-init a temporary context if stopped, or just use a new one for the one-shot
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const tempCtx = new Ctor();

    const master = tempCtx.createGain();
    master.gain.value = 0.5;
    master.connect(tempCtx.destination);

    if (this.isSeinfeldMode) {
      // Sad trombone: Wah wah wahhh
      const notes = [
        { freq: 311.13, dur: 0.4 }, // Eb4
        { freq: 293.66, dur: 0.4 }, // D4
        { freq: 277.18, dur: 0.4 }, // Db4
        { freq: 261.63, dur: 1.2 }, // C4
      ];

      let time = tempCtx.currentTime;
      notes.forEach((note, i) => {
        const osc = tempCtx.createOscillator();
        osc.type = 'sawtooth'; // brassy
        
        const env = tempCtx.createGain();
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(0.5, time + 0.05);
        
        if (i === notes.length - 1) {
          // the final "wahhh" bends down and fades slowly
          osc.frequency.setValueAtTime(note.freq, time);
          osc.frequency.exponentialRampToValueAtTime(note.freq * 0.8, time + note.dur);
          env.gain.exponentialRampToValueAtTime(0.01, time + note.dur);
        } else {
          osc.frequency.setValueAtTime(note.freq, time);
          env.gain.linearRampToValueAtTime(0, time + note.dur - 0.05);
        }

        osc.connect(env);
        env.connect(master);
        osc.start(time);
        osc.stop(time + note.dur);
        time += note.dur;
      });

      // Close context after sound finishes
      setTimeout(() => tempCtx.close(), time * 1000 + 500);

    } else {
      // Dark glitchy failure sound
      const osc = tempCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, tempCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, tempCtx.currentTime + 2);

      const env = tempCtx.createGain();
      env.gain.setValueAtTime(0.8, tempCtx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.01, tempCtx.currentTime + 2);

      osc.connect(env);
      env.connect(master);
      osc.start();
      osc.stop(tempCtx.currentTime + 2);
      
      setTimeout(() => tempCtx.close(), 2500);
    }
  }

  public playVictorySound() {
    this.stop(); // Stop the background loop
    
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const tempCtx = new Ctor();

    const master = tempCtx.createGain();
    master.gain.value = 0.5;
    master.connect(tempCtx.destination);

    // Triumphant synth swell
    const osc1 = tempCtx.createOscillator();
    const osc2 = tempCtx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    
    osc1.frequency.setValueAtTime(440, tempCtx.currentTime); // A4
    osc2.frequency.setValueAtTime(554.37, tempCtx.currentTime); // C#5 (Major third)

    const env = tempCtx.createGain();
    env.gain.setValueAtTime(0, tempCtx.currentTime);
    env.gain.linearRampToValueAtTime(0.4, tempCtx.currentTime + 1); // Swell up
    env.gain.exponentialRampToValueAtTime(0.01, tempCtx.currentTime + 4); // Fade out

    osc1.connect(env);
    osc2.connect(env);
    env.connect(master);

    osc1.start();
    osc2.start();
    osc1.stop(tempCtx.currentTime + 4);
    osc2.stop(tempCtx.currentTime + 4);

    setTimeout(() => tempCtx.close(), 4500);
  }
}

export const darkAmbientAudio = new AudioController();
