/**
 * One Euro Filter — adaptive low-pass filter tuned for human-interaction signals.
 * Used to smooth MediaPipe hand landmarks: aggressive smoothing when the hand is
 * nearly still (kills jitter), and much lighter smoothing when moving fast
 * (kills lag). This is the standard approach used in production gesture/AR systems.
 *
 * Reference: Casiez, Roussel, Vogel — "1€ Filter: A Simple Speed-based
 * Low-pass Filter for Noisy Input in Interactive Systems" (CHI 2012).
 */

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

class LowPassFilter {
  private y: number | null = null;
  private isInitialized = false;

  filter(value: number, a: number): number {
    if (!this.isInitialized) {
      this.y = value;
      this.isInitialized = true;
      return value;
    }
    const result = a * value + (1 - a) * (this.y as number);
    this.y = result;
    return result;
  }

  get last(): number {
    return this.y ?? 0;
  }

  reset() {
    this.isInitialized = false;
    this.y = null;
  }
}

export interface OneEuroOptions {
  /** Minimum cutoff frequency — lower = smoother but more lag at rest */
  minCutoff?: number;
  /** Speed coefficient — higher = filter reacts faster to quick motion */
  beta?: number;
  /** Cutoff for the derivative filter */
  derivateCutoff?: number;
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  constructor(opts: OneEuroOptions = {}) {
    this.minCutoff = opts.minCutoff ?? 1.0;
    this.beta = opts.beta ?? 0.4;
    this.dCutoff = opts.derivateCutoff ?? 1.0;
  }

  filter(value: number, timestamp: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      this.xFilter.filter(value, 1);
      return value;
    }
    let dt = (timestamp - this.lastTime) / 1000;
    if (dt <= 0) dt = 1 / 60;
    this.lastTime = timestamp;

    const dx = (value - this.xFilter.last) / dt;
    const edx = this.dxFilter.filter(dx, alpha(this.dCutoff, dt));

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, alpha(cutoff, dt));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/** Smooths an (x, y, z) point using three independent One Euro filters. */
export class Point3DFilter {
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;
  private fz: OneEuroFilter;

  constructor(opts: OneEuroOptions = {}) {
    this.fx = new OneEuroFilter(opts);
    this.fy = new OneEuroFilter(opts);
    this.fz = new OneEuroFilter(opts);
  }

  filter(x: number, y: number, z: number, t: number): [number, number, number] {
    return [this.fx.filter(x, t), this.fy.filter(y, t), this.fz.filter(z, t)];
  }

  reset() {
    this.fx.reset();
    this.fy.reset();
    this.fz.reset();
  }
}

/** Simple exponential moving average — used for cheap scalar smoothing (confidence, depth). */
export class EMA {
  private value: number | null = null;
  private factor: number;
  constructor(factor: number = 0.25) {
    this.factor = factor;
  }
  push(v: number): number {
    this.value = this.value === null ? v : this.value + this.factor * (v - this.value);
    return this.value;
  }
  get current() {
    return this.value ?? 0;
  }
  reset() {
    this.value = null;
  }
}

/** Predicts a future point along current velocity to compensate for pipeline latency. */
export function predictPosition(
  pos: { x: number; y: number },
  vel: { x: number; y: number },
  lookaheadSec: number
): { x: number; y: number } {
  return {
    x: pos.x + vel.x * lookaheadSec,
    y: pos.y + vel.y * lookaheadSec,
  };
}
