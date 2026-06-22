import { motion } from 'framer-motion';
import { Volume2, VolumeX, Hand, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useHandStore } from '@/store/useHandStore';
import { audioEngine } from '@/lib/audio';

function SmallBtn({ onClick, title, active, children }: {
  onClick: () => void; title: string; active?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title}
      className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
      style={{
        background: active ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${active ? 'rgba(0,245,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
        color: active ? '#00f5ff' : 'rgba(255,255,255,0.5)',
      }}>
      {children}
    </button>
  );
}

export function TopBar() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const toggleSound = useAppStore((s) => s.toggleSound);
  const showHandSkeleton = useAppStore((s) => s.showHandSkeleton);
  const toggleHandSkeleton = useAppStore((s) => s.toggleHandSkeleton);
  const restartOnboarding = useAppStore((s) => s.restartOnboarding);
  const fps = useHandStore((s) => s.fps);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-3 py-3 sm:px-5">
      {/* Brand */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="relative flex h-7 w-7 items-center justify-center">
          <span className="absolute inset-0 rounded-lg border border-cyan/40" style={{ transform: 'rotate(45deg)' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_rgba(0,245,255,0.9)]" />
        </div>
        <span className="font-display hidden text-sm font-medium tracking-[0.14em] text-white/85 sm:block">
          GESTURE<span style={{ color: '#00f5ff' }}>IN</span>
        </span>
      </div>

      {/* Mode switcher */}
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full p-1"
           style={{ background: 'rgba(6,2,18,0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
        {(['draw', 'objects'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); audioEngine.play('ui'); }}
            className="relative rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition-colors"
            style={{ color: mode === m ? '#05000f' : 'rgba(255,255,255,0.5)' }}>
            {mode === m && (
              <motion.span layoutId="mode-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(90deg,#00f5ff,#35d4ff)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative font-display">{m === 'draw' ? 'Draw' : 'Objects'}</span>
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        {fps > 0 && (
          <span className="hidden font-mono text-[10px] uppercase tracking-wider sm:block"
                style={{ color: fps > 45 ? '#2eff9c' : fps > 25 ? '#35d4ff' : '#ff6080' }}>
            {fps}fps
          </span>
        )}
        <SmallBtn onClick={() => { toggleHandSkeleton(); audioEngine.play('ui'); }} title="Hand skeleton" active={showHandSkeleton}>
          <Hand size={13} />
        </SmallBtn>
        <SmallBtn onClick={() => { toggleSound(); audioEngine.setMuted(soundEnabled); }} title="Sound" active={soundEnabled}>
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </SmallBtn>
        <SmallBtn onClick={() => { restartOnboarding(); audioEngine.play('ui'); }} title="Tutorial">
          <RotateCcw size={13} />
        </SmallBtn>
      </div>
    </div>
  );
}
