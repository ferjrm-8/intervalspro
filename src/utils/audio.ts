/**
 * Web Audio API synthesizer for the workout timer.
 * Generates custom sound effects procedurally.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // We lazy-initialize the audio context to comply with browser autoplay policies.
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.initContext();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private playTone(frequency: number, type: OscillatorType, duration: number, volume: number = 0.5, delay: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Create components
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime + delay);

    // Envelope
    const startTime = this.ctx.currentTime + delay;
    gainNode.gain.setValueAtTime(0.001, startTime);
    // Linear ramp up
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    // Exponential ramp down
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Connect
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Start & Stop
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * High-pitch pip for the countdown ticks (5, 4, 3, 2, 1)
   */
  public playTick() {
    this.playTone(880, 'sine', 0.08, 0.4);
  }

  /**
   * Energetic double beep for starting exercise
   */
  public playWorkStart() {
    this.playTone(987.77, 'sine', 0.12, 0.5, 0); // B5
    this.playTone(1318.51, 'sine', 0.25, 0.5, 0.15); // E6
  }

  /**
   * Descending warning beep or buzzer for end of work (start of rest)
   */
  public playWorkEnd() {
    // Generate a deep buzzer/alarm style tone
    this.playTone(440, 'triangle', 0.5, 0.6);
  }

  /**
   * Sound for starting rest
   */
  public playRestStart() {
    this.playTone(523.25, 'sine', 0.3, 0.4); // C5
  }

  /**
   * Triumph arpeggio for the end of the entire workout session
   */
  public playSuccess() {
    const tempo = 0.12;
    this.playTone(523.25, 'sine', 0.2, 0.4, 0 * tempo); // C5
    this.playTone(659.25, 'sine', 0.2, 0.4, 1 * tempo); // E5
    this.playTone(783.99, 'sine', 0.2, 0.4, 2 * tempo); // G5
    this.playTone(1046.50, 'sine', 0.4, 0.5, 3 * tempo); // C6
  }
}

export const audio = new AudioEngine();
