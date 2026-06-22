import { useRef } from 'react';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useAppStore } from '@/store/useAppStore';

interface HandTrackingProviderProps {
  active: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function HandTrackingProvider({ active, videoRef }: HandTrackingProviderProps) {
  const setInputMode = useAppStore((s) => s.setInputMode);
  const pushTip = useAppStore((s) => s.pushTip);
  const handledError = useRef(false);

  useHandTracking(videoRef, active, (err) => {
    console.error('Camera/tracking error', err);
    if (!handledError.current) {
      handledError.current = true;
      setInputMode('mouse');
      pushTip('Camera unavailable — switched to mouse control', 3);
    }
  });

  return null;
}
