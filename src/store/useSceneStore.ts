import { create } from 'zustand';
import type { Stroke, SceneObjectState, ObjectKind, Vec3 } from '@/types';
import { NEON_PALETTE } from '@/lib/colors';

interface BrushSettings {
  color: string;
  size: number; // 0..1
  glow: number; // 0..1
  opacity: number; // 0..1
}

interface HistorySnapshot {
  strokes: Stroke[];
  objects: SceneObjectState[];
}

interface SceneState {
  strokes: Stroke[];
  objects: SceneObjectState[];
  brush: BrushSettings;
  selectedObjectId: string | null;
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  setBrushColor: (hex: string) => void;
  setBrushSize: (v: number) => void;
  setBrushGlow: (v: number) => void;
  setBrushOpacity: (v: number) => void;

  startStroke: (point: Vec3) => string;
  appendToStroke: (id: string, point: Vec3) => void;
  finishStroke: (id: string) => void;
  removeStroke: (id: string) => void;

  spawnObject: (kind: ObjectKind, position: [number, number, number]) => string;
  updateObjectTransform: (id: string, position: [number, number, number], scale?: number) => void;
  duplicateObject: (id: string) => string | null;
  removeObject: (id: string) => void;
  setSelectedObject: (id: string | null) => void;

  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

function snapshot(s: { strokes: Stroke[]; objects: SceneObjectState[] }): HistorySnapshot {
  return {
    strokes: s.strokes.map((st) => ({ ...st, points: [...st.points] })),
    objects: s.objects.map((o) => ({ ...o })),
  };
}

export const useSceneStore = create<SceneState>((set, get) => ({
  strokes: [],
  objects: [],
  brush: {
    color: NEON_PALETTE[0].hex,
    size: 0.4,
    glow: 0.7,
    opacity: 0.9,
  },
  selectedObjectId: null,
  past: [],
  future: [],

  setBrushColor: (hex) => set((s) => ({ brush: { ...s.brush, color: hex } })),
  setBrushSize: (v) => set((s) => ({ brush: { ...s.brush, size: v } })),
  setBrushGlow: (v) => set((s) => ({ brush: { ...s.brush, glow: v } })),
  setBrushOpacity: (v) => set((s) => ({ brush: { ...s.brush, opacity: v } })),

  startStroke: (point) => {
    const id = nextId('stroke');
    const { brush } = get();
    get().pushHistory();
    set((s) => ({
      strokes: [
        ...s.strokes,
        {
          id,
          points: [point],
          color: brush.color,
          size: brush.size,
          glow: brush.glow,
          opacity: brush.opacity,
          createdAt: Date.now(),
        },
      ],
    }));
    return id;
  },

  appendToStroke: (id, point) => {
    set((s) => ({
      strokes: s.strokes.map((st) =>
        st.id === id ? { ...st, points: [...st.points, point] } : st
      ),
    }));
  },

  finishStroke: () => {
    // no-op placeholder for future stroke-finalization logic (e.g. simplification)
  },

  removeStroke: (id) => {
    set((s) => ({ strokes: s.strokes.filter((st) => st.id !== id) }));
  },

  spawnObject: (kind, position) => {
    const id = nextId('obj');
    get().pushHistory();
    set((s) => ({
      objects: [
        ...s.objects,
        {
          id,
          kind,
          color: s.brush.color,
          position,
          scale: 1,
          createdAt: Date.now(),
        },
      ],
    }));
    return id;
  },

  updateObjectTransform: (id, position, scale) => {
    set((s) => ({
      objects: s.objects.map((o) =>
        o.id === id ? { ...o, position, scale: scale ?? o.scale } : o
      ),
    }));
  },

  duplicateObject: (id) => {
    const obj = get().objects.find((o) => o.id === id);
    if (!obj) return null;
    const newId = nextId('obj');
    get().pushHistory();
    set((s) => ({
      objects: [
        ...s.objects,
        {
          ...obj,
          id: newId,
          position: [obj.position[0] + 0.4, obj.position[1] + 0.15, obj.position[2]],
          createdAt: Date.now(),
        },
      ],
    }));
    return newId;
  },

  removeObject: (id) => {
    get().pushHistory();
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
    }));
  },

  setSelectedObject: (id) => set({ selectedObjectId: id }),

  clearAll: () => {
    get().pushHistory();
    set({ strokes: [], objects: [], selectedObjectId: null });
  },

  pushHistory: () => {
    const { strokes, objects, past } = get();
    set({
      past: [...past.slice(-19), snapshot({ strokes, objects })],
      future: [],
    });
  },

  undo: () => {
    const { past, strokes, objects, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      strokes: prev.strokes,
      objects: prev.objects,
      past: past.slice(0, -1),
      future: [...future, snapshot({ strokes, objects })],
    });
  },

  redo: () => {
    const { future, strokes, objects, past } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      strokes: next.strokes,
      objects: next.objects,
      future: future.slice(0, -1),
      past: [...past, snapshot({ strokes, objects })],
    });
  },
}));
