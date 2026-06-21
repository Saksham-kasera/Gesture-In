import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { CinematicBackground } from '@/components/background/CinematicBackground';
import { AirDrawingCanvas } from '@/components/drawing/AirDrawingCanvas';
import { ObjectLab } from '@/components/objects/ObjectLab';
import { InteractionController } from './InteractionController';
import { HandCursorOrbs3D } from '@/components/cursor/HandCursorOrbs3D';
import { useAppStore } from '@/store/useAppStore';
import { setCanvasElement } from '@/lib/canvasRegistry';

export function Scene() {
  const perf = useAppStore((s) => s.perf);
  const setPerfTier = useAppStore((s) => s.setPerfTier);
  const [dpr, setDpr] = useState(perf.dprCap);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: true }}
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 60 }}
      className="!absolute inset-0"
      onCreated={({ gl }) => setCanvasElement(gl.domElement)}
    >
      <PerformanceMonitor
        onIncline={() => setPerfTier('high')}
        onDecline={() => {
          setPerfTier(perf.tier === 'high' ? 'medium' : 'low');
          setDpr(Math.max(1, dpr - 0.4));
        }}
      />
      <Suspense fallback={null}>
        <CinematicBackground />
        <AirDrawingCanvas />
        <ObjectLab />
        <HandCursorOrbs3D />
        <InteractionController />
      </Suspense>
      {perf.bloomEnabled && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.35} mipmapBlur radius={0.7} />
          <ChromaticAberration offset={[0.0006, 0.0012]} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0} />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
          <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
