// Core shared types for GestureIn

export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z: number };

export type Handedness = 'Left' | 'Right';

/** A single normalized landmark from MediaPipe (0..1 range, z is relative depth) */
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** The 21 MediaPipe hand landmarks, smoothed */
export type HandLandmarks = Landmark[];

export type GestureType =
  | 'none'
  | 'point'        // index extended, rest folded -> draw
  | 'open_palm'     // all fingers extended -> pause / hover
  | 'pinch'         // thumb + index close -> grab / erase
  | 'fist'          // all folded -> crush
  | 'peace'         // index + middle extended
  | 'double_pinch';  // rapid pinch-release-pinch -> duplicate

export interface TrackedHand {
  id: string;
  handedness: Handedness;
  landmarks: HandLandmarks;
  rawLandmarks: HandLandmarks;
  gesture: GestureType;
  pinchStrength: number; // 0..1, 1 = fully pinched
  isPinching: boolean;
  confidence: number;
  /** Cursor position projected to screen space (px) */
  screenPosition: Vec2;
  /** Velocity in px/sec, used for throw / flick detection */
  velocity: Vec2;
  /** Smoothed normalized depth (0 close .. 1 far) */
  depth: number;
  visible: boolean;
  lastSeen: number;
}

export type AppMode = 'draw' | 'objects';

export type InputMode = 'hand' | 'touch' | 'mouse';

export interface PerformanceProfile {
  tier: 'high' | 'medium' | 'low';
  particleCount: number;
  bloomEnabled: boolean;
  shadowsEnabled: boolean;
  dprCap: number;
}

export type ObjectKind =
  | 'cube'
  | 'sphere'
  | 'pyramid'
  | 'capsule'
  | 'crystal'
  | 'cylinder'
  | 'torus'
  | 'core'
  | 'drone';

export interface HologramColor {
  name: string;
  hex: string;
}

export interface Stroke {
  id: string;
  points: Vec3[];
  color: string;
  size: number;
  glow: number;
  opacity: number;
  createdAt: number;
}

export interface SceneObjectState {
  id: string;
  kind: ObjectKind;
  color: string;
  position: [number, number, number];
  scale: number;
  createdAt: number;
}

export interface AssistantTip {
  id: string;
  text: string;
  priority: number;
  expiresAt?: number;
}

export type EffectKind = 'burst' | 'spawn' | 'merge' | 'ripple';

export interface EffectEvent {
  id: string;
  kind: EffectKind;
  position: [number, number, number];
  color: string;
  createdAt: number;
}
