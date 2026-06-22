import { create } from 'zustand';
import type { GestureType, Handedness, Vec2 } from '@/types';

export interface CursorHandState {
  screen: Vec2;
  world: [number, number, number];
  gesture: GestureType;
  isPinching: boolean;
  pinchStrength: number;
  velocity: Vec2;
  speed: number; // px/sec magnitude, used for throw/flick thresholds
  visible: boolean;
}

const EMPTY_HAND: CursorHandState = {
  screen: { x: 0, y: 0 },
  world: [0, 0, 0],
  gesture: 'none',
  isPinching: false,
  pinchStrength: 0,
  velocity: { x: 0, y: 0 },
  speed: 0,
  visible: false,
};

interface CursorStoreState {
  left: CursorHandState;
  right: CursorHandState;
  primary: Handedness;
  setHand: (h: Handedness, state: CursorHandState) => void;
  setPrimary: (h: Handedness) => void;
}

export const useCursorStore = create<CursorStoreState>((set) => ({
  left: EMPTY_HAND,
  right: EMPTY_HAND,
  primary: 'Right',
  setHand: (h, state) => set(h === 'Left' ? { left: state } : { right: state }),
  setPrimary: (h) => set({ primary: h }),
}));
