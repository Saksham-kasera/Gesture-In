import type { HandLandmarks, GestureType } from '@/types';

// MediaPipe hand landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_MCP = 2;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const INDEX_MCP = 5;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;

function dist(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Returns true if a finger (given tip/pip indices) is extended relative to the wrist. */
function isExtended(lm: HandLandmarks, tip: number, pip: number, mcp: number): boolean {
  const wrist = lm[WRIST];
  const dTip = dist(lm[tip], wrist);
  const dPip = dist(lm[pip], wrist);
  const dMcp = dist(lm[mcp], wrist);
  return dTip > dPip && dTip > dMcp * 1.15;
}

export interface GestureAnalysis {
  gesture: GestureType;
  pinchStrength: number; // 0 (open) -> 1 (fully pinched)
  isPinching: boolean;
  fingersExtended: { thumb: boolean; index: boolean; middle: boolean; ring: boolean; pinky: boolean };
}

const PINCH_ON = 0.055;
const PINCH_OFF = 0.09;

export function analyzeGesture(lm: HandLandmarks, prevPinching: boolean): GestureAnalysis {
  const index = isExtended(lm, INDEX_TIP, INDEX_PIP, INDEX_MCP);
  const middle = isExtended(lm, MIDDLE_TIP, MIDDLE_PIP, INDEX_MCP);
  const ring = isExtended(lm, RING_TIP, RING_PIP, INDEX_MCP);
  const pinky = isExtended(lm, PINKY_TIP, PINKY_PIP, INDEX_MCP);
  const thumb = dist(lm[THUMB_TIP], lm[PINKY_MCP_FALLBACK(lm)]) > dist(lm[THUMB_MCP], lm[PINKY_MCP_FALLBACK(lm)]) * 1.05;

  const pinchDist = dist(lm[THUMB_TIP], lm[INDEX_TIP]);
  const handScale = dist(lm[WRIST], lm[INDEX_MCP]) || 0.1;
  const normalizedPinch = pinchDist / handScale;

  const threshold = prevPinching ? PINCH_OFF : PINCH_ON;
  const isPinching = normalizedPinch < threshold;
  const pinchStrength = clamp01(1 - normalizedPinch / (threshold * 2.2));

  let gesture: GestureType = 'none';

  if (isPinching) {
    gesture = 'pinch';
  } else if (index && !middle && !ring && !pinky) {
    gesture = 'point';
  } else if (index && middle && !ring && !pinky) {
    gesture = 'peace';
  } else if (index && middle && ring && pinky) {
    gesture = 'open_palm';
  } else if (!index && !middle && !ring && !pinky) {
    gesture = 'fist';
  }

  return {
    gesture,
    pinchStrength,
    isPinching,
    fingersExtended: { thumb, index, middle, ring, pinky },
  };
}

function PINKY_MCP_FALLBACK(lm: HandLandmarks) {
  return 17 < lm.length ? 17 : WRIST;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Detects a double-pinch sequence (pinch -> release -> pinch within a window) for "duplicate". */
export class DoublePinchDetector {
  private lastReleaseAt = 0;
  private wasPinching = false;
  private readonly windowMs: number;

  constructor(windowMs = 450) {
    this.windowMs = windowMs;
  }

  /** Call every frame with current pinch state + timestamp(ms). Returns true once on the second pinch-down. */
  update(isPinching: boolean, t: number): boolean {
    let triggered = false;
    if (isPinching && !this.wasPinching) {
      if (t - this.lastReleaseAt < this.windowMs && this.lastReleaseAt !== 0) {
        triggered = true;
        this.lastReleaseAt = 0;
      }
    }
    if (!isPinching && this.wasPinching) {
      this.lastReleaseAt = t;
    }
    this.wasPinching = isPinching;
    return triggered;
  }
}
