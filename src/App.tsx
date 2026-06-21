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
  const inputMode = useAppStore((s) => s.inputMode);
  const setInputMode = useAppStore((s) => s.setInputMode);
  const soundEnabled = useAppStore((s) => s.soundEnabled);

  useEffect(() => {
    if (isCoarsePointerDevice()) {
      setInputMode('touch');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    audioEngine.setMuted(!soundEnabled);
  }, [soundEnabled]);

  const trackingActive = inputMode === 'hand' && onboardingStep !== 'welcome';

  return (
    <div className="gesturein-canvas-root relative h-full w-full overflow-hidden bg-void">
      {/* Hidden video element feeding the hand-tracking pipeline */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      <Scene />

      {inputMode === 'hand' && <HandTrackingProvider active={trackingActive} videoRef={videoRef} />}
      {inputMode === 'touch' && <TouchFallback />}

      <SpatialCursor />

      {inputMode === 'hand' && <WebcamPreview videoRef={videoRef} />}

      <TopBar />
      <Toolbar />
      <AIAssistant />

      <Onboarding />

      <div className="scanline-overlay pointer-events-none fixed inset-0 z-20" />
      <div className="noise-grain pointer-events-none fixed inset-0 z-20 opacity-[0.025]" />
    </div>
  );
}
