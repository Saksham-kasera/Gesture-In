import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useHandStore } from '@/store/useHandStore';
import type { TrackedHand } from '@/types';

const EMPTY_LANDMARKS = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

export function TouchFallback() {
  const inputMode = useAppStore((s) => s.inputMode);
  const mode = useAppStore((s) => s.mode);
  const lastPoint = useRef<{ x: number; y: number; t: number } | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (inputMode !== 'touch') return;

    function buildHand(x: number, y: number, pinching: boolean, vx: number, vy: number): TrackedHand {
      return {
        id: 'touch-right',
        handedness: 'Right',
        landmarks: EMPTY_LANDMARKS,
        rawLandmarks: EMPTY_LANDMARKS,
        gesture: pinching ? 'pinch' : 'point',
        pinchStrength: pinching ? 1 : 0,
        isPinching: pinching,
        confidence: 1,
        screenPosition: { x, y },
        velocity: { x: vx, y: vy },
        depth: 0.45,
        visible: true,
        lastSeen: Date.now(),
      };
    }

    function onStart(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      active.current = true;
      lastPoint.current = { x: t.clientX, y: t.clientY, t: performance.now() };
      const pinching = mode === 'objects';
      useHandStore.getState().setHands([buildHand(t.clientX, t.clientY, pinching, 0, 0)]);
    }

    function onMove(e: TouchEvent) {
      if (!active.current) return;
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      const now = performance.now();
      const prev = lastPoint.current;
      const dt = prev ? Math.max(1, now - prev.t) / 1000 : 1;
      const vx = prev ? (t.clientX - prev.x) / dt : 0;
      const vy = prev ? (t.clientY - prev.y) / dt : 0;
      lastPoint.current = { x: t.clientX, y: t.clientY, t: now };
      const pinching = mode === 'objects';
      useHandStore.getState().setHands([buildHand(t.clientX, t.clientY, pinching, vx, vy)]);
    }

    function onEnd() {
      active.current = false;
      lastPoint.current = null;
      useHandStore.getState().setHands([]);
    }

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      useHandStore.getState().setHands([]);
    };
  }, [inputMode, mode]);

  return null;
}
