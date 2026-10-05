/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private motorOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  setIsEnabled(enabled: boolean) {
    this.setEnabled(enabled);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } else {
      this.stopMotorSound();
    }
  }

  playRelayClick() {
    try {
      this.initContext();
      if (!this.audioCtx || this.audioCtx.state !== 'running') return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.audioCtx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy handled silently
    }
  }

  startMotorSound(freq: number, isRunning: boolean) {
    try {
      if (!this.isEnabled) return;
      this.initContext();
      if (!this.audioCtx) return;

      if (!isRunning) {
        this.stopMotorSound();
        return;
      }

      if (!this.motorOsc) {
        this.motorOsc = this.audioCtx.createOscillator();
        this.motorGain = this.audioCtx.createGain();

        this.motorOsc.type = 'sawtooth';
        this.motorGain.gain.setValueAtTime(0.02, this.audioCtx.currentTime);

        this.motorOsc.connect(this.motorGain);
        this.motorGain.connect(this.audioCtx.destination);
        this.motorOsc.start();
      }

      const clampedFreq = Math.max(25, Math.min(200, freq * 3));
      this.motorOsc.frequency.setTargetAtTime(clampedFreq, this.audioCtx.currentTime, 0.05);
    } catch {
      // Silent catch
    }
  }

  stopMotorSound() {
    try {
      if (this.motorOsc) {
        this.motorOsc.stop();
        this.motorOsc.disconnect();
        this.motorOsc = null;
      }
      if (this.motorGain) {
        this.motorGain.disconnect();
        this.motorGain = null;
      }
    } catch {
      // Silent catch
    }
  }
}

export const audioService = new AudioService();
