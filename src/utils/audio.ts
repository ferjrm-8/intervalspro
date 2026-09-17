import { AudioSettings, SoundTheme, SoundVolume } from '../types';

/**
 * Advanced High-Output Web Audio API synthesizer for the workout timer.
 * Features:
 * - Dynamic compression and peak limiter for maximum RMS loudness without distortion.
 * - Multi-harmonic layered sounds: Referee Whistle, Boxing Bell, Digital Beep, Stadium Buzzer.
 * - Loudness booster up to 2.2x gain.
 * - Spanish Text-To-Speech (TTS) Voice Prompts.
 * - Device Haptic Vibration integration.
 */

const AUDIO_CONFIG_KEY = 'workout_interval_audio_settings_v1';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  
  private settings: AudioSettings = {
    volume: 'ultra', // Default to ultra strong volume so user never misses a cue!
    theme: 'whistle', // Default to whistle/stadium which cuts through any noise
    voiceEnabled: true,
    vibrationEnabled: true,
  };

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(AUDIO_CONFIG_KEY);
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      }
    } catch {
      // safe fallback
    }
  }

  public saveSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AUDIO_CONFIG_KEY, JSON.stringify(this.settings));
      }
    } catch {
      // safe fallback
    }
    this.applyGain();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();

        // 1. Create a dynamic compressor for maximum loudness and punch
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

        // 2. Create Master Gain Node
        this.masterGain = this.ctx.createGain();
        this.applyGain();

        // Chain: [Nodes] -> Compressor -> MasterGain -> Destination
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private getVolumeMultiplier(): number {
    switch (this.settings.volume) {
      case 'normal':
        return 0.9;
      case 'high':
        return 1.4;
      case 'ultra':
      default:
        return 2.0; // 2x gain boost through compressor
    }
  }

  private applyGain() {
    if (this.masterGain && this.ctx) {
      const gainVal = this.isMuted ? 0 : this.getVolumeMultiplier();
      this.masterGain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.initContext();
    }
    this.applyGain();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Haptic vibration feedback for mobile devices
   */
  public triggerVibrate(pattern: number | number[]) {
    if (!this.settings.vibrationEnabled || this.isMuted) return;
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignored if device doesn't support vibrate
    }
  }

  /**
   * Speak a short prompt in Spanish using SpeechSynthesis
   */
  public speak(text: string) {
    if (this.isMuted || !this.settings.voiceEnabled) return;
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Cancel any pending speech so it doesn't queue up
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.15; // Slightly brisk for athletic cueing
        utterance.pitch = 1.05;
        
        // Find Spanish voice if available
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(v => v.lang.startsWith('es'));
        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // safe fallback
    }
  }

  /**
   * Play high loudness procedural synth sound
   */
  private playRawTone(
    freq: number, 
    type: OscillatorType, 
    duration: number, 
    volume: number = 0.8, 
    delay: number = 0,
    pitchEnd?: number
  ) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.compressor) return;

    const startTime = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (pitchEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchEnd), startTime + duration);
    }

    // High punch envelope
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.compressor);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * High-frequency referee whistle simulation
   * Pierces through high ambient background noise
   */
  private playRefereeWhistle(duration: number = 0.28, delay: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.compressor) return;

    const startTime = this.ctx.currentTime + delay;
    
    // Whistle uses 2 high pitched fundamental frequencies with tremolo/vibrato
    const freqs = [2850, 3120];
    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      // Vibrato modulation
      const mod = this.ctx!.createOscillator();
      const modGain = this.ctx!.createGain();
      mod.frequency.value = 32; // 32 Hz whistle flutter
      modGain.gain.value = 85;
      mod.connect(osc.frequency);
      mod.start(startTime);
      mod.stop(startTime + duration);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(0.65, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.compressor!);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Loud Boxing bell / Gong sound
   */
  private playBoxingBell(delay: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.compressor) return;

    const harmonics = [
      { freq: 650, vol: 0.8, dur: 0.9, type: 'sine' as OscillatorType },
      { freq: 1180, vol: 0.6, dur: 0.7, type: 'triangle' as OscillatorType },
      { freq: 1760, vol: 0.5, dur: 0.5, type: 'sine' as OscillatorType },
      { freq: 2420, vol: 0.4, dur: 0.35, type: 'square' as OscillatorType },
    ];

    harmonics.forEach(h => {
      this.playRawTone(h.freq, h.type, h.dur, h.vol, delay);
    });
  }

  /**
   * Loud Buzzer / Horn
   */
  private playBuzzerSound(duration: number = 0.45, delay: number = 0) {
    this.playRawTone(220, 'sawtooth', duration, 0.7, delay);
    this.playRawTone(330, 'square', duration, 0.5, delay);
    this.playRawTone(440, 'sawtooth', duration, 0.4, delay);
  }

  /**
   * Loud Digital Beep
   */
  private playDigitalBeep(freq: number, duration: number = 0.15, delay: number = 0) {
    this.playRawTone(freq, 'square', duration, 0.6, delay);
    this.playRawTone(freq * 1.5, 'triangle', duration, 0.4, delay);
  }

  /**
   * Countdown tick (3, 2, 1)
   */
  public playTick(secondNumber?: number) {
    this.triggerVibrate(80);
    
    // Voice prompt for countdown
    if (secondNumber && secondNumber <= 3 && secondNumber >= 1 && this.settings.voiceEnabled) {
      this.speak(`${secondNumber}`);
    }

    const theme = this.settings.theme;
    if (theme === 'whistle') {
      this.playRefereeWhistle(0.12);
    } else if (theme === 'boxing') {
      this.playRawTone(880, 'sine', 0.1, 0.7);
    } else if (theme === 'buzzer') {
      this.playRawTone(350, 'sawtooth', 0.12, 0.6);
    } else {
      this.playDigitalBeep(1200, 0.1);
    }
  }

  /**
   * Strong Sound for Work / Fast Pace Start
   */
  public playWorkStart(customLabel?: string) {
    this.triggerVibrate([180, 80, 220]);
    
    // Voice cue
    const voiceText = customLabel || '¡A trabajar!';
    this.speak(voiceText);

    const theme = this.settings.theme;
    if (theme === 'whistle') {
      this.playRefereeWhistle(0.35, 0);
      this.playRefereeWhistle(0.45, 0.2);
    } else if (theme === 'boxing') {
      this.playBoxingBell(0);
      this.playBoxingBell(0.18);
    } else if (theme === 'buzzer') {
      this.playBuzzerSound(0.5);
    } else {
      // Digital high energy
      this.playDigitalBeep(987.77, 0.15, 0);
      this.playDigitalBeep(1567.98, 0.35, 0.15);
    }
  }

  /**
   * Sound for Warmup Start
   */
  public playWarmupStart() {
    this.triggerVibrate([150, 100, 150]);
    this.speak('¡Iniciamos calentamiento!');
    this.playRawTone(523.25, 'triangle', 0.3, 0.7, 0);
    this.playRawTone(659.25, 'triangle', 0.4, 0.8, 0.15);
  }

  /**
   * Sound for Cooldown / Vuelta a la Calma Start
   */
  public playCooldownStart() {
    this.triggerVibrate([300]);
    this.speak('¡Vuelta a la calma y enfriamiento!');
    this.playRawTone(783.99, 'sine', 0.4, 0.7, 0);
    this.playRawTone(523.25, 'sine', 0.6, 0.8, 0.2);
  }

  /**
   * Sound for End of Work / Start of Rest
   */
  public playWorkEnd(customLabel?: string) {
    this.triggerVibrate(350);

    const voiceText = customLabel || '¡Descanso!';
    this.speak(voiceText);

    const theme = this.settings.theme;
    if (theme === 'whistle') {
      this.playRefereeWhistle(0.5);
    } else if (theme === 'boxing') {
      this.playBoxingBell(0);
    } else if (theme === 'buzzer') {
      this.playBuzzerSound(0.6);
    } else {
      this.playRawTone(440, 'sawtooth', 0.4, 0.7);
    }
  }

  /**
   * Sound for Series Rest
   */
  public playSeriesRestStart() {
    this.triggerVibrate([200, 100, 200]);
    this.speak('¡Fin de ronda, descanso de serie!');
    this.playRawTone(440, 'triangle', 0.3, 0.7, 0);
    this.playRawTone(349.23, 'triangle', 0.5, 0.8, 0.2);
  }

  /**
   * Grand Triumph Fanfare on complete
   */
  public playSuccess() {
    this.triggerVibrate([200, 100, 200, 100, 400]);
    this.speak('¡Entrenamiento completado! ¡Gran trabajo!');

    const tempo = 0.12;
    this.playRawTone(523.25, 'triangle', 0.25, 0.8, 0 * tempo);
    this.playRawTone(659.25, 'triangle', 0.25, 0.8, 1 * tempo);
    this.playRawTone(783.99, 'triangle', 0.25, 0.8, 2 * tempo);
    this.playRawTone(1046.50, 'square', 0.6, 0.9, 3 * tempo);
  }

  /**
   * Test current sound settings
   */
  public testCurrentSound() {
    this.initContext();
    this.playWorkStart('¡Prueba de sonido alta potencia!');
  }
}

export const audio = new AudioEngine();
