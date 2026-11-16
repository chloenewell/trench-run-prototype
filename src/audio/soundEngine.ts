class TrenchSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private speaking: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel: number = 0.09,
    delay: number = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playUiClick(): void {
    this.playTone(540, 760, 0.08, 'triangle', 0.06);
  }

  public playLaneShift(): void {
    this.playTone(320, 480, 0.09, 'sine', 0.05);
  }

  public playJump(): void {
    this.playTone(260, 620, 0.18, 'triangle', 0.08);
  }

  public playThrusterPulse(): void {
    this.playTone(180, 290, 0.07, 'sine', 0.035);
  }

  public playCorrectPacket(): void {
    this.playTone(523.25, 523.25, 0.12, 'triangle', 0.09, 0);
    this.playTone(659.25, 659.25, 0.12, 'triangle', 0.09, 0.07);
    this.playTone(783.99, 1046.5, 0.22, 'sine', 0.09, 0.14);
  }

  public playWrongOrder(): void {
    this.playTone(240, 175, 0.16, 'sawtooth', 0.055, 0);
    this.playTone(180, 140, 0.2, 'sawtooth', 0.05, 0.12);
  }

  public playObstacleBump(): void {
    this.playTone(150, 70, 0.18, 'square', 0.06);
  }

  public playCheckpointSuccess(): void {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => {
      this.playTone(n, n, 0.18, 'triangle', 0.08, idx * 0.075);
    });
  }

  public playMissionCleared(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      this.playTone(n, n, 0.28, 'triangle', 0.09, idx * 0.09);
    });
  }

  // Accessible Web Speech API Read-Aloud
  public speak(text: string, onEnd?: () => void): boolean {
    if (this.muted) return false;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96;
      utterance.pitch = 1.04;
      utterance.onend = () => {
        this.speaking = false;
        onEnd?.();
      };
      utterance.onerror = () => {
        this.speaking = false;
        onEnd?.();
      };
      this.speaking = true;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      this.speaking = false;
      return false;
    }
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.speaking = false;
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }
}

export const soundEngine = new TrenchSoundEngine();
