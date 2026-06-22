import { create } from 'zustand';
import type { EffectEvent, EffectKind } from '@/types';

interface EffectsState {
  effects: EffectEvent[];
  spawn: (kind: EffectKind, position: [number, number, number], color: string) => void;
  remove: (id: string) => void;
}

let counter = 0;

export const useEffectsStore = create<EffectsState>((set) => ({
  effects: [],
  spawn: (kind, position, color) => {
    const id = `fx-${counter++}`;
    set((s) => ({ effects: [...s.effects, { id, kind, position, color, createdAt: Date.now() }] }));
  },
  remove: (id) => set((s) => ({ effects: s.effects.filter((e) => e.id !== id) })),
}));
