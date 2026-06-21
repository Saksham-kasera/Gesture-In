import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useHandStore } from '@/store/useHandStore';
import { HAND_CONNECTIONS } from '@/lib/handConnections';
import { Eye, EyeOff } from 'lucide-react';

interface WebcamPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function WebcamPreview({ videoRef }: WebcamPreviewProps) {
  const show = useAppStore((s) => s.showWebcamPreview);
  const toggle = useAppStore((s) => s.toggleWebcamPreview);
  const cameraReady = useHandStore((s) => s.cameraReady);
  const fps = useHandStore((s) => s.fps);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (video && video.readyState >= 2) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      const showSkeleton = useAppStore.getState().showHandSkeleton;
      if (showSkeleton) {
        const hands = useHandStore.getState().hands;
        hands.forEach((hand) => {
        const color = hand.handedness === 'Left' ? '#8a2eff' : '#00f5ff';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;

        HAND_CONNECTIONS.forEach(([a, b]) => {
          const pa = hand.landmarks[a];
          const pb = hand.landmarks[b];
          if (!pa || !pb) return;
          ctx.beginPath();
          ctx.moveTo((1 - pa.x) * w, pa.y * h);
          ctx.lineTo((1 - pb.x) * w, pb.y * h);
          ctx.stroke();
        });
        hand.landmarks.forEach((p) => {
          ctx.beginPath();
          ctx.arc((1 - p.x) * w, p.y * h, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });
        });
        ctx.shadowBlur = 0;
      }
    }
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef]);

  return (
    <div className="pointer-events-auto fixed bottom-5 left-5 z-30">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="glass glass-border-glow relative mb-2 overflow-hidden rounded-xl"
            style={{ width: 200, height: 150 }}
          >
            <canvas ref={canvasRef} width={200} height={150} className="h-full w-full" />
            <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider">
              <span className={`h-1.5 w-1.5 rounded-full ${cameraReady ? 'bg-green animate-pulse-slow' : 'bg-white/30'}`} />
              {cameraReady ? `Tracking · ${fps}fps` : 'Connecting'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={toggle}
        className="glass flex h-9 w-9 items-center justify-center rounded-full border border-cyan/30 text-cyan/80 transition-colors hover:text-cyan"
        aria-label="Toggle camera preview"
      >
        {show ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
    </div>
  );
}
