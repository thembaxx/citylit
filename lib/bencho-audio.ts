/**
 * Sensory & Bencho Synthesized Audio Engine
 * Zero-dependency Web Audio API sound synthesis inspired by Bencho (bencho.dev)
 * and Sensory UI (sensory-ui.com) & Waves (libraries.dev/waves).
 * Generates tactile micro-interaction audio and procedural ambient soundscapes client-side
 * with zero media file downloads.
 */

export type AmbientSoundType = "waves" | "rain" | "wind" | "night" | "none";

class BenchoAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private ambientEnabled: boolean = false;
  private ambientVolume: number = 0.25;

  // Ambient sound nodes
  private ambientGain: GainNode | null = null;
  private ambientSourceNodes: (AudioNode | number)[] = [];
  private currentAmbientType: AmbientSoundType = "none";

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopAmbient();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setAmbientEnabled(val: boolean) {
    this.ambientEnabled = val;
    if (!val) {
      this.stopAmbient();
    } else if (this.currentAmbientType !== "none") {
      this.startAmbient(this.currentAmbientType);
    }
  }

  public isAmbientEnabled(): boolean {
    return this.ambientEnabled;
  }

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume * 0.18, this.ctx.currentTime, 0.1);
    }
  }

  /** Soft tactile click on button press, pill tap, or card select */
  public playClick(freq = 600, duration = 0.04) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + duration);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  }

  /** Ultra-crisp subtle tactile tap for navigation, chips, and pills */
  public playTap(freq = 820) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const dur = 0.028;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + dur);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch {
      // Ignored
    }
  }

  /** Mechanical micro-tick for sliders, time scrubbers, and dials */
  public playTick(pitch = 1400) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const dur = 0.015;

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + dur);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch {
      // Ignored
    }
  }

  /** Viscous liquid pop for switches and toggles */
  public playLiquidToggle(on: boolean) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const duration = 0.08;

      osc.type = "sine";
      if (on) {
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + duration);
      } else {
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + duration);
      }

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignored
    }
  }

  /** Soft filtered whoosh for carousels, sheet reveals, and view transitions */
  public playWhoosh() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const dur = 0.18;

      // Filtered noise buffer
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(1100, now + dur * 0.5);
      filter.frequency.exponentialRampToValueAtTime(220, now + dur);
      filter.Q.setValueAtTime(1.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + dur * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + dur);
    } catch {
      // Ignored
    }
  }

  /** Celebratory harmonic chime on slide confirmation or day completion */
  public playConfirm() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.05;
        const dur = 0.38;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.065, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      // Ignored
    }
  }

  /** Gentle weather condition transition sound */
  public playWeatherShift() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignored
    }
  }

  /**
   * Procedural Ambient Sound Synthesizer (libraries.dev/waves inspired)
   * Generates organic coastal waves, gentle rain, mountain breeze, or night crickets
   * purely using Web Audio nodes (no external mp3 files).
   */
  public startAmbient(type: AmbientSoundType) {
    this.currentAmbientType = type;
    if (!this.enabled || !this.ambientEnabled || type === "none") {
      this.stopAmbient();
      return;
    }
    const ctx = this.getContext();
    if (!ctx) return;

    this.stopAmbientNodes();

    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, now);
      master.gain.setTargetAtTime(this.ambientVolume * 0.15, now, 0.4);
      master.connect(ctx.destination);
      this.ambientGain = master;

      if (type === "waves") {
        // Coastal waves: Pink noise + swept bandpass filter modulated by LFO
        const dur = 4.0;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const d = buf.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0;
        for (let i = 0; i < buf.length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          d[i] = (b0 + b1 + b2) * 0.22;
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(260, now);

        // LFO for surf swelling in and receding
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, now); // ~8 second wave cycle
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(240, now);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        src.connect(filter);
        filter.connect(master);

        src.start(now);
        lfo.start(now);

        this.ambientSourceNodes.push(src, lfo, filter, lfoGain, master);
      } else if (type === "rain") {
        // Light rain: Filtered high noise + random droplet ticks
        const dur = 3.0;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < buf.length; i++) {
          d[i] = (Math.random() * 2 - 1) * 0.18;
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(0.8, now);

        src.connect(filter);
        filter.connect(master);
        src.start(now);

        this.ambientSourceNodes.push(src, filter, master);
      } else if (type === "wind") {
        // Mountain breeze: Low-pass filtered noise with gentle swell
        const dur = 5.0;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < buf.length; i++) {
          d[i] = (Math.random() * 2 - 1) * 0.25;
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(180, now);
        filter.Q.setValueAtTime(2.5, now);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.18, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(90, now);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        src.connect(filter);
        filter.connect(master);

        src.start(now);
        lfo.start(now);

        this.ambientSourceNodes.push(src, lfo, filter, lfoGain, master);
      } else if (type === "night") {
        // Night crickets: Subtle high-frequency frequency-modulated oscillator
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(4600, now);

        const mod = ctx.createOscillator();
        mod.frequency.setValueAtTime(16, now); // 16Hz chirp
        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(300, now);

        mod.connect(modGain);
        modGain.connect(osc.frequency);

        const cricketGain = ctx.createGain();
        cricketGain.gain.setValueAtTime(0.012, now);

        osc.connect(cricketGain);
        cricketGain.connect(master);

        osc.start(now);
        mod.start(now);

        this.ambientSourceNodes.push(osc, mod, modGain, cricketGain, master);
      }
    } catch {
      // Ignored
    }
  }

  private stopAmbientNodes() {
    this.ambientSourceNodes.forEach((node) => {
      if (
        typeof node !== "number" &&
        "stop" in node &&
        typeof (node as AudioScheduledSourceNode).stop === "function"
      ) {
        try {
          (node as AudioScheduledSourceNode).stop();
        } catch {
          // Ignored
        }
      }
      if (typeof node !== "number" && "disconnect" in node) {
        try {
          node.disconnect();
        } catch {
          // Ignored
        }
      }
    });
    this.ambientSourceNodes = [];
    this.ambientGain = null;
  }

  public stopAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
        setTimeout(() => {
          this.stopAmbientNodes();
        }, 300);
      } catch {
        this.stopAmbientNodes();
      }
    } else {
      this.stopAmbientNodes();
    }
  }

  public getCurrentAmbient(): AmbientSoundType {
    return this.currentAmbientType;
  }
}

export const benchoAudio = new BenchoAudioEngine();
export default benchoAudio;
