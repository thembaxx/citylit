/**
 * Sensory & Bencho Synthesized Audio Engine
 * Zero-dependency Web Audio API sound synthesis inspired by Bencho (bencho.dev)
 * and Sensory UI (sensory-ui.com) & Waves (libraries.dev/waves).
 * Generates tactile micro-interaction audio and procedural ambient soundscapes client-side
 * with zero media file downloads.
 */

export type AmbientSoundType = "waves" | "rain" | "wind" | "night" | "none";

const SOUND_STORAGE_KEY = "citylit-sound-effects";
const AMBIENT_STORAGE_KEY = "citylit-ambient-audio";

class BenchoAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private ambientEnabled: boolean = false;
  private ambientVolume: number = 0.25;
  private hydrated: boolean = false;

  // Ambient sound nodes
  private ambientGain: GainNode | null = null;
  private ambientSourceNodes: AudioNode[] = [];
  private currentAmbientType: AmbientSoundType = "none";
  private ambientStopTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTickAt: number = 0;
  private lastTapAt: number = 0;

  private hydratePreferences() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      const savedSound = localStorage.getItem(SOUND_STORAGE_KEY);
      if (savedSound === "off") this.enabled = false;
      else if (savedSound === "on") this.enabled = true;

      const savedAmbient = localStorage.getItem(AMBIENT_STORAGE_KEY);
      if (savedAmbient === "on") this.ambientEnabled = true;
    } catch {
      // Storage unavailable
    }
  }

  private withRunningContext(fn: (ctx: AudioContext) => void) {
    if (typeof window === "undefined") return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    const ctx = this.ctx;
    if (ctx.state === "running") {
      fn(ctx);
    } else if (ctx.state === "suspended") {
      void ctx
        .resume()
        .then(() => {
          if (ctx.state === "running") fn(ctx);
        })
        .catch(() => {});
    }
  }

  public setEnabled(val: boolean) {
    this.hydrated = true;
    this.enabled = val;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, val ? "on" : "off");
    } catch {
      // Ignored
    }
    if (!val) {
      this.stopAmbient();
    }
  }

  public isEnabled(): boolean {
    this.hydratePreferences();
    return this.enabled;
  }

  public setAmbientEnabled(val: boolean) {
    this.hydrated = true;
    this.ambientEnabled = val;
    try {
      localStorage.setItem(AMBIENT_STORAGE_KEY, val ? "on" : "off");
    } catch {
      // Ignored
    }
    if (!val) {
      this.stopAmbient();
    } else if (this.currentAmbientType !== "none") {
      this.startAmbient(this.currentAmbientType);
    }
  }

  public isAmbientEnabled(): boolean {
    this.hydratePreferences();
    return this.ambientEnabled;
  }

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume * 0.18, this.ctx.currentTime, 0.1);
    }
  }

  private scheduleTone(
    ctx: AudioContext,
    opts: {
      type?: OscillatorType;
      fromFreq: number;
      toFreq?: number;
      startOffset?: number;
      duration: number;
      peakGain: number;
    },
  ) {
    const start = ctx.currentTime + (opts.startOffset ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.fromFreq, start);
    if (opts.toFreq !== undefined && opts.toFreq !== opts.fromFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.toFreq), start + opts.duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(opts.peakGain, start + Math.min(0.008, opts.duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + opts.duration + 0.01);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /** Soft tactile click on button press, pill tap, or card select */
  public playClick(freq = 600, duration = 0.04) {
    if (!this.isEnabled()) return;
    const nowMs = performance.now();
    if (nowMs - this.lastTapAt < 45) return;
    this.lastTapAt = nowMs;
    this.withRunningContext((ctx) => {
      try {
        this.scheduleTone(ctx, {
          type: "sine",
          fromFreq: freq,
          toFreq: 120,
          duration,
          peakGain: 0.075,
        });
      } catch {
        // Ignored
      }
    });
  }

  /** Ultra-crisp subtle tactile tap for navigation, chips, and pills */
  public playTap(freq = 820) {
    if (!this.isEnabled()) return;
    const nowMs = performance.now();
    if (nowMs - this.lastTapAt < 45) return;
    this.lastTapAt = nowMs;
    this.withRunningContext((ctx) => {
      try {
        this.scheduleTone(ctx, {
          type: "triangle",
          fromFreq: freq,
          toFreq: 240,
          duration: 0.028,
          peakGain: 0.06,
        });
      } catch {
        // Ignored
      }
    });
  }

  /** Mechanical micro-tick for sliders, time scrubbers, and dials */
  public playTick(pitch = 1400) {
    if (!this.isEnabled()) return;
    const nowMs = performance.now();
    if (nowMs - this.lastTickAt < 40) return;
    this.lastTickAt = nowMs;
    this.withRunningContext((ctx) => {
      try {
        this.scheduleTone(ctx, {
          type: "sine",
          fromFreq: pitch,
          toFreq: 320,
          duration: 0.016,
          peakGain: 0.042,
        });
      } catch {
        // Ignored
      }
    });
  }

  /** Viscous liquid pop for switches and toggles */
  public playLiquidToggle(on: boolean) {
    if (!this.isEnabled()) return;
    this.withRunningContext((ctx) => {
      try {
        this.scheduleTone(ctx, {
          type: "sine",
          fromFreq: on ? 280 : 620,
          toFreq: on ? 740 : 220,
          duration: 0.08,
          peakGain: 0.068,
        });
      } catch {
        // Ignored
      }
    });
  }

  /** Warm rising dyad when opening a modal or sheet */
  public playModalOpen() {
    if (!this.isEnabled()) return;
    this.withRunningContext((ctx) => {
      try {
        this.scheduleTone(ctx, { fromFreq: 392, toFreq: 440, duration: 0.09, peakGain: 0.042 });
        this.scheduleTone(ctx, {
          fromFreq: 523.25,
          toFreq: 587.33,
          startOffset: 0.035,
          duration: 0.12,
          peakGain: 0.038,
        });
      } catch {
        // Ignored
      }
    });
  }

  /** Quiet descending tap when closing a modal or sheet */
  public playModalClose() {
    if (!this.isEnabled()) return;
    this.withRunningContext((ctx) => {
      try {
        this.scheduleTone(ctx, { fromFreq: 480, toFreq: 260, duration: 0.055, peakGain: 0.04 });
      } catch {
        // Ignored
      }
    });
  }

  /** Crystalline cartographic chime for selecting a city beacon or landmark */
  public playBeaconSelect() {
    if (!this.isEnabled()) return;
    this.withRunningContext((ctx) => {
      try {
        this.scheduleTone(ctx, { fromFreq: 587.33, duration: 0.16, peakGain: 0.045 });
        this.scheduleTone(ctx, {
          fromFreq: 880,
          startOffset: 0.04,
          duration: 0.22,
          peakGain: 0.038,
        });
      } catch {
        // Ignored
      }
    });
  }

  /** Soft filtered whoosh for carousels, sheet reveals, and view transitions */
  public playWhoosh() {
    if (!this.isEnabled()) return;
    this.withRunningContext((ctx) => {
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
        noise.stop(now + dur + 0.01);
        noise.onended = () => {
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
      } catch {
        // Ignored
      }
    });
  }

  /** Celebratory harmonic chime on slide confirmation or day completion */
  public playConfirm() {
    if (!this.isEnabled()) return;
    this.withRunningContext((ctx) => {
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          this.scheduleTone(ctx, {
            fromFreq: freq,
            startOffset: idx * 0.05,
            duration: 0.36,
            peakGain: 0.055,
          });
        });
      } catch {
        // Ignored
      }
    });
  }

  /** Gentle weather condition transition sound */
  public playWeatherShift() {
    if (!this.isEnabled()) return;
    this.withRunningContext((ctx) => {
      try {
        this.scheduleTone(ctx, {
          fromFreq: 440,
          toFreq: 880,
          duration: 0.14,
          peakGain: 0.038,
        });
      } catch {
        // Ignored
      }
    });
  }

  /**
   * Procedural Ambient Sound Synthesizer (libraries.dev/waves inspired)
   * Generates organic coastal waves, gentle rain, mountain breeze, or night crickets
   * purely using Web Audio nodes (no external mp3 files).
   */
  public startAmbient(type: AmbientSoundType) {
    this.currentAmbientType = type;
    if (this.ambientStopTimer) {
      clearTimeout(this.ambientStopTimer);
      this.ambientStopTimer = null;
    }
    if (!this.isEnabled() || !this.isAmbientEnabled() || type === "none") {
      this.stopAmbient();
      return;
    }
    this.withRunningContext((ctx) => {
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
    });
  }

  private stopAmbientNodes() {
    this.ambientSourceNodes.forEach((node) => {
      if ("stop" in node && typeof (node as AudioScheduledSourceNode).stop === "function") {
        try {
          (node as AudioScheduledSourceNode).stop();
        } catch {
          // Ignored
        }
      }
      if ("disconnect" in node) {
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
    if (this.ambientStopTimer) {
      clearTimeout(this.ambientStopTimer);
      this.ambientStopTimer = null;
    }
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
        this.ambientStopTimer = setTimeout(() => {
          this.ambientStopTimer = null;
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
