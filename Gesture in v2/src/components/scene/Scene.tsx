import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { CinematicBackground } from '@/components/background/CinematicBackground';
import { AirDrawingCanvas } from '@/components/drawing/AirDrawingCanvas';
import { ObjectLab } from '@/components/objects/ObjectLab';
import { InteractionController } from './InteractionController';
import { HandCursorOrbs3D } from '@/components/cursor/HandCursorOrbs3D';
import { useAppStore } from '@/store/useAppStore';
import { setCanvasElement } from '@/lib/canvasRegistry';
import { isCoarsePointerDevice } from '@/lib/device';

export function Scene() {
  const perf = useAppStore((s) => s.perf);
  const setPerfTier = useAppStore((s) => s.setPerfTier);

  // Always start at DPR 1 — upgrade only if device proves itself fast
  const [dpr, setDpr] = useState(1);
  const declineCount = useRef(0);
  const inclineCount = useRef(0);

  useEffect(() => {
    // Lock mobile to DPR 1, low tier immediately
    if (isCoarsePointerDevice()) {
      setPerfTier('low');
      setDpr(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: false, // off by default — big perf win on mobile
        powerPreference: 'high-performance',
        alpha: false,
        preserveDrawingBuffer: true,
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 60 }}
      className="!absolute inset-0"
      onCreated={({ gl }) => {
        setCanvasElement(gl.domElement);
        // Enable antialias only on desktop high-res screens
        // (can't change after context creation, but we chose false above;
        //  the bloom-less design doesn't need AA anyway)
      }}
    >
      <PerformanceMonitor
        iterations={5}
        threshold={0.9}
        onIncline={() => {
          inclineCount.current++;
          declineCount.current = 0;
          if (inclineCount.current >= 3 && perf.tier === 'medium') {
            setPerfTier('high');
            setDpr(Math.min(window.devicePixelRatio, 1.5));
          }
        }}
        onDecline={() => {
          declineCount.current++;
          inclineCount.current = 0;
          if (declineCount.current >= 2) {
            if (perf.tier === 'high') setPerfTier('medium');
            else if (perf.tier === 'medium') setPerfTier('low');
            setDpr(1);
          }
        }}
      />
      <Suspense fallback={null}>
        <CinematicBackground />
        <AirDrawingCanvas />
        <ObjectLab />
        <HandCursorOrbs3D />
        <InteractionController />
      </Suspense>
      {/* No postprocessing by default — bloom was the main source of UX breakage */}
    </Canvas>
  );
}
