import { useEffect, useRef } from 'react';
import { Scene } from '@/components/scene/Scene';
import { TopBar } from '@/components/scene/TopBar';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { SpatialCursor } from '@/components/cursor/SpatialCursor';
import { WebcamPreview } from '@/components/webcam/WebcamPreview';
import { HandTrackingProvider } from '@/components/webcam/HandTrackingProvider';
import { TouchFallback } from '@/components/mobile/TouchFallback';
import { useAppStore } from '@/store/useAppStore';
import { audioEngine } from '@/lib/audio';
import { isCoarsePointerDevice } from '@/lib/device';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onboardingStep = useAppStore((s) => s.onboardingStep);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const inputMode = useAppStore((s) => s.inputMode);
  const setInputMode = useAppStore((s) => s.setInputMode);
  const setPerfTier = useAppStore((s) => s.setPerfTier);
  const soundEnabled = useAppStore((s) => s.soundEnabled);

  useEffect(() => {
    // Detect touch-only / mobile devices immediately
    if (isCoarsePointerDevice()) {
      setInputMode('touch');
      setPerfTier('low');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    audioEngine.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Only activate hand tracking after user passes the camera permission step
  const trackingActive =
    inputMode === 'hand' &&
    onboardingComplete;

  return (
    <div className="gesturein-canvas-root relative h-full w-full overflow-hidden bg-void">
      {/* Hidden video element — only matters when hand tracking is active */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      <Scene />

      {inputMode === 'hand' && <HandTrackingProvider active={trackingActive} videoRef={videoRef} />}
      {inputMode === 'touch' && <TouchFallback />}

      <SpatialCursor />

      {inputMode === 'hand' && onboardingComplete && <WebcamPreview videoRef={videoRef} />}

      <TopBar />
      <Toolbar />
      <AIAssistant />

      <Onboarding />

      {/* Very subtle scanline overlay - dark enough to not affect content */}
      <div className="scanline-overlay pointer-events-none fixed inset-0 z-20 opacity-30" />
    </div>
  );
}
