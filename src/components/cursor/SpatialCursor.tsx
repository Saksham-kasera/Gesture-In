import { useEffect, useRef } from 'react';
import { useCursorStore, type CursorHandState } from '@/store/useCursorStore';
import { useAppStore } from '@/store/useAppStore';
import type { Handedness } from '@/types';

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

interface Ripple {
  x: number;
  y: number;
  start: number;
  color: string;
}

const TRAIL_LIFETIME = 380; // ms
const RIPPLE_LIFETIME = 600; // ms

function gestureColor(hand: CursorHandState): string {
  if (hand.isPinching) return '#ff2ee0';
  if (hand.gesture === 'point') return '#00f5ff';
  if (hand.gesture === 'fist') return '#ff5050';
  if (hand.gesture === 'open_palm') return '#8a2eff';
  return '#35d4ff';
}

export function SpatialCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRefs = useRef<Record<Handedness, HTMLDivElement | null>>({ Left: null, Right: null });
  const labelRefs = useRef<Record<Handedness, HTMLDivElement | null>>({ Left: null, Right: null });
  const trails = useRef<Record<Handedness, TrailPoint[]>>({ Left: [], Right: [] });
  const ripples = useRef<Ripple[]>([]);
  const wasPinching = useRef<Record<Handedness, boolean>>({ Left: false, Right: false });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2);
      canvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      if (!ctx || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();
      const showWebcamPreview = useAppStore.getState().showWebcamPreview;

      (['Left', 'Right'] as Handedness[]).forEach((handedness) => {
        const hand = handedness === 'Left' ? useCursorStore.getState().left : useCursorStore.getState().right;
        const ring = ringRefs.current[handedness];
        const label = labelRefs.current[handedness];
        const trail = trails.current[handedness];

        if (!hand.visible) {
          if (ring) ring.style.opacity = '0';
          return;
        }

        const color = gestureColor(hand);

        // update trail
        trail.push({ x: hand.screen.x, y: hand.screen.y, t: now });
        while (trail.length && now - trail[0].t > TRAIL_LIFETIME) trail.shift();

        // draw trail
        if (trail.length > 1) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          for (let i = 1; i < trail.length; i++) {
            const p0 = trail[i - 1];
            const p1 = trail[i];
            const age = 1 - (now - p1.t) / TRAIL_LIFETIME;
            if (age <= 0) continue;
            ctx.strokeStyle = color;
            ctx.globalAlpha = age * 0.55;
            ctx.lineWidth = (2 + age * 5) * dpr;
            ctx.shadowColor = color;
            ctx.shadowBlur = 14 * dpr * age;
            ctx.beginPath();
            ctx.moveTo(p0.x * dpr, p0.y * dpr);
            ctx.lineTo(p1.x * dpr, p1.y * dpr);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }

        // ripple trigger on pinch rising edge
        if (hand.isPinching && !wasPinching.current[handedness]) {
          ripples.current.push({ x: hand.screen.x, y: hand.screen.y, start: now, color });
        }
        wasPinching.current[handedness] = hand.isPinching;

        // update DOM ring
        if (ring) {
          ring.style.opacity = '1';
          ring.style.transform = `translate(${hand.screen.x}px, ${hand.screen.y}px) translate(-50%, -50%) scale(${
            1 - hand.pinchStrength * 0.35
          })`;
          ring.style.borderColor = color;
          ring.style.boxShadow = `0 0 ${14 + hand.pinchStrength * 18}px ${color}, 0 0 4px ${color} inset`;
          ring.style.background =
            hand.isPinching ? `${color}33` : 'transparent';
        }
        if (label) {
          label.style.opacity = showWebcamPreview ? '0.85' : '0';
          label.style.transform = `translate(${hand.screen.x}px, ${hand.screen.y - 34}px) translate(-50%, -100%)`;
          label.textContent = `${handedness === 'Left' ? 'L' : 'R'} · ${hand.gesture.replace('_', ' ')}`;
        }
      });

      // draw ripples
      ripples.current = ripples.current.filter((r) => now - r.start < RIPPLE_LIFETIME);
      ripples.current.forEach((r) => {
        const age = (now - r.start) / RIPPLE_LIFETIME;
        const radius = (10 + age * 50) * dpr;
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = 1 - age;
        ctx.lineWidth = 2.5 * dpr;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10 * dpr;
        ctx.beginPath();
        ctx.arc(r.x * dpr, r.y * dpr, radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {(['Left', 'Right'] as Handedness[]).map((h) => (
        <div key={h}>
          <div
            ref={(el) => {
              ringRefs.current[h] = el;
            }}
            className="absolute left-0 top-0 h-9 w-9 rounded-full border-2 opacity-0 transition-[opacity,background] duration-150"
            style={{ willChange: 'transform' }}
          />
          <div
            ref={(el) => {
              labelRefs.current[h] = el;
            }}
            className="font-mono absolute left-0 top-0 whitespace-nowrap text-[10px] uppercase tracking-wider text-cyan opacity-0"
            style={{ willChange: 'transform', textShadow: '0 0 8px rgba(0,245,255,0.8)' }}
          />
        </div>
      ))}
    </div>
  );
}
