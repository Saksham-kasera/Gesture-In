import { useEffect, useRef } from 'react';
import { getHandLandmarker } from '@/lib/handTracking';
import { Point3DFilter, OneEuroFilter, EMA, predictPosition } from '@/lib/smoothing';
import { analyzeGesture, DoublePinchDetector } from '@/lib/gestures';
import { useHandStore } from '@/store/useHandStore';
import type { TrackedHand, Handedness } from '@/types';

interface HandRuntime {
  landmarkFilter: Point3DFilter[];
  cursorX: OneEuroFilter;
  cursorY: OneEuroFilter;
  depthEma: EMA;
  confidenceEma: EMA;
  doublePinch: DoublePinchDetector;
  prevScreen: { x: number; y: number } | null;
  prevPinching: boolean;
  lastUpdate: number;
}

function makeRuntime(): HandRuntime {
  return {
    landmarkFilter: Array.from({ length: 21 }, () => new Point3DFilter({ minCutoff: 0.7, beta: 0.55 })),
    cursorX: new OneEuroFilter({ minCutoff: 0.9, beta: 0.9 }),
    cursorY: new OneEuroFilter({ minCutoff: 0.9, beta: 0.9 }),
    depthEma: new EMA(0.2),
    confidenceEma: new EMA(0.3),
    doublePinch: new DoublePinchDetector(),
    prevScreen: null,
    prevPinching: false,
    lastUpdate: performance.now(),
  };
}

const LOOKAHEAD_SEC = 0.035; // latency compensation window

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onCameraError: (err: unknown) => void
) {
  const runtimes = useRef<Record<Handedness, HandRuntime>>({
    Left: makeRuntime(),
    Right: makeRuntime(),
  });
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fpsCounter = useRef({ frames: 0, last: performance.now() });
  const lastVideoTime = useRef(-1);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        useHandStore.getState().setCameraReady(true);

        const landmarker = await getHandLandmarker();
        useHandStore.getState().setTracking(true);
        loop(landmarker, video);
      } catch (err) {
        onCameraError(err);
      }
    }

    function loop(landmarker: Awaited<ReturnType<typeof getHandLandmarker>>, video: HTMLVideoElement) {
      const tick = () => {
        if (cancelled) return;
        rafRef.current = requestAnimationFrame(tick);
        if (video.readyState < 2 || video.currentTime === lastVideoTime.current) return;
        lastVideoTime.current = video.currentTime;

        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);

        const tracked: TrackedHand[] = [];
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;

        result.landmarks.forEach((lm, idx) => {
          const handed = result.handedness[idx]?.[0];
          const handedness: Handedness = (handed?.categoryName as Handedness) ?? 'Right';
          const rt = runtimes.current[handedness] ?? makeRuntime();
          runtimes.current[handedness] = rt;

          const smoothed = lm.map((pt, i) => {
            const [x, y, z] = rt.landmarkFilter[i].filter(pt.x, pt.y, pt.z, now);
            return { x, y, z };
          });

          const gestureInfo = analyzeGesture(smoothed, rt.prevPinching);
          rt.prevPinching = gestureInfo.isPinching;

          // Cursor anchor: index fingertip when pointing/pinching, else palm centroid
          const anchor = smoothed[8];
          const rawScreenX = (1 - anchor.x) * w; // mirror for selfie view
          const rawScreenY = anchor.y * h;

          const fx = rt.cursorX.filter(rawScreenX, now);
          const fy = rt.cursorY.filter(rawScreenY, now);

          let vx = 0;
          let vy = 0;
          const dt = Math.max((now - rt.lastUpdate) / 1000, 1 / 120);
          if (rt.prevScreen) {
            vx = (fx - rt.prevScreen.x) / dt;
            vy = (fy - rt.prevScreen.y) / dt;
          }
          rt.prevScreen = { x: fx, y: fy };
          rt.lastUpdate = now;

          const predicted = predictPosition({ x: fx, y: fy }, { x: vx, y: vy }, LOOKAHEAD_SEC);

          const depth = rt.depthEma.push(Math.max(0, Math.min(1, 0.5 - anchor.z * 2)));
          const confidence = rt.confidenceEma.push(handed?.score ?? 0.5);

          const doubleTriggered = rt.doublePinch.update(gestureInfo.isPinching, now);

          tracked.push({
            id: handedness,
            handedness,
            landmarks: smoothed,
            rawLandmarks: lm,
            gesture: doubleTriggered ? 'double_pinch' : gestureInfo.gesture,
            pinchStrength: gestureInfo.pinchStrength,
            isPinching: gestureInfo.isPinching,
            confidence,
            screenPosition: predicted,
            velocity: { x: vx, y: vy },
            depth,
            visible: true,
            lastSeen: now,
          });
        });

        useHandStore.getState().setHands(tracked);

        fpsCounter.current.frames++;
        if (now - fpsCounter.current.last > 500) {
          const fps = (fpsCounter.current.frames * 1000) / (now - fpsCounter.current.last);
          useHandStore.getState().setFps(Math.round(fps));
          fpsCounter.current.frames = 0;
          fpsCounter.current.last = now;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      useHandStore.getState().setCameraReady(false);
      useHandStore.getState().setTracking(false);
      useHandStore.getState().setHands([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
