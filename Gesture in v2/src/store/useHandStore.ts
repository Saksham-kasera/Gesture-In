import { create } from 'zustand';
import type { TrackedHand, GestureType } from '@/types';

interface HandStoreState {
  hands: TrackedHand[];
  primaryHandId: string | null;
  cameraReady: boolean;
  tracking: boolean;
  fps: number;
  setHands: (hands: TrackedHand[]) => void;
  setCameraReady: (v: boolean) => void;
  setTracking: (v: boolean) => void;
  setFps: (v: number) => void;
}

export const useHandStore = create<HandStoreState>((set) => ({
  hands: [],
  primaryHandId: null,
  cameraReady: false,
  tracking: false,
  fps: 0,
  setHands: (hands) =>
    set({
      hands,
      primaryHandId: hands[0]?.id ?? null,
    }),
  setCameraReady: (v) => set({ cameraReady: v }),
  setTracking: (v) => set({ tracking: v }),
  setFps: (v) => set({ fps: v }),
}));

/** Convenience selector for the dominant/first tracked hand */
export function usePrimaryHand(): TrackedHand | null {
  return useHandStore((s) => s.hands.find((h) => h.id === s.primaryHandId) ?? s.hands[0] ?? null);
}

export function useGesture(): GestureType {
  return useHandStore((s) => {
    const h = s.hands.find((x) => x.id === s.primaryHandId) ?? s.hands[0];
    return h?.gesture ?? 'none';
  });
}
