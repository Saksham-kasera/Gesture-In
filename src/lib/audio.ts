/**
 * Spatial audio engine for GestureIn.
 * All sound effects are synthesized in real time via the Web Audio API
 * (oscillators + filtered noise) so the app ships with zero audio assets.
 * Each sound is positioned in 3D using a PannerNode for spatial feedback.
 */

type SoundName = 'grab' | 'release' | 'throw' | 'break' | 'spawn' | 'hover' | 'duplicate' | 'delete' | 'ui';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private lastHoverAt = 0;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
  }

  setVolume(v: number) {
    if (this.master) this.master.gain.value = v;
  }

  private noiseBuffer(ctx: AudioContext, duration: number) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private panner(ctx: AudioContext, pos?: [number, number, number]) {
    const p = ctx.createStereoPanner();
    if (pos) {
      p.pan.value = Math.max(-1, Math.min(1, pos[0] * 1.5));
    }
    return p;
  }

  play(name: SoundName, pos?: [number, number, number], intensity = 1) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;

    switch (name) {
      case 'hover': {
        if (now * 1000 - this.lastHoverAt < 90) return;
        this.lastHoverAt = now * 1000;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1400 + Math.random() * 200;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04 * intensity, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        const pan = this.panner(ctx, pos);
        osc.connect(gain).connect(pan).connect(this.master);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'grab': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        const pan = this.panner(ctx, pos);
        osc.connect(gain).connect(pan).connect(this.master);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'release': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        const pan = this.panner(ctx, pos);
        osc.connect(gain).connect(pan).connect(this.master);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'throw': {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer(ctx, 0.35);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.25);
        filter.Q.value = 0.8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.22 * Math.min(1.5, intensity), now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        const pan = this.panner(ctx, pos);
        noise.connect(filter).connect(gain).connect(pan).connect(this.master);
        noise.start(now);
        noise.stop(now + 0.35);
        break;
      }
      case 'break': {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer(ctx, 0.4);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.35);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.12, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        const pan = this.panner(ctx, pos);
        noise.connect(filter).connect(gain).connect(pan).connect(this.master);
        osc.connect(oscGain).connect(pan);
        noise.start(now);
        noise.stop(now + 0.4);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'spawn': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(360, now);
        osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.35);
        const pan = this.panner(ctx, pos);
        osc.connect(gain).connect(pan).connect(this.master);
        osc2.connect(gain);
        osc.start(now);
        osc.stop(now + 0.4);
        osc2.start(now);
        osc2.stop(now + 0.4);
        break;
      }
      case 'duplicate': {
        this.play('grab', pos);
        setTimeout(() => this.play('spawn', pos), 90);
        break;
      }
      case 'delete': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        const pan = this.panner(ctx, pos);
        osc.connect(gain).connect(pan).connect(this.master);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
      case 'ui': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 760;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.connect(gain).connect(this.master);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }
    }
  }
}

export const audioEngine = new AudioEngine();
