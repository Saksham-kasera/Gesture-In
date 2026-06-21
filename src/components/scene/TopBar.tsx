import { motion } from 'framer-motion';
import { Volume2, VolumeX, Hand, RotateCcw, Activity } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useHandStore } from '@/store/useHandStore';
import { audioEngine } from '@/lib/audio';

export function TopBar() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const toggleSound = useAppStore((s) => s.toggleSound);
  const showHandSkeleton = useAppStore((s) => s.showHandSkeleton);
  const toggleHandSkeleton = useAppStore((s) => s.toggleHandSkeleton);
  const restartOnboarding = useAppStore((s) => s.restartOnboarding);
  const perf = useAppStore((s) => s.perf);
  const fps = useHandStore((s) => s.fps);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-4 sm:p-5">
      <div className="pointer-events-auto flex items-center gap-2.5">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <span className="absolute inset-0 rounded-lg border border-cyan/50" style={{ transform: 'rotate(45deg)' }} />
          <span className="absolute inset-1.5 rounded-md border border-violet/50" style={{ transform: 'rotate(45deg)' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_rgba(0,245,255,0.9)]" />
        </div>
        <span className="font-display text-sm font-medium tracking-[0.15em] text-white/90">
          GESTURE<span className="text-glow-cyan text-cyan">IN</span>
        </span>
      </div>

      <div className="glass glass-border-glow pointer-events-auto flex items-center gap-1 rounded-full p-1">
        {(['draw', 'objects'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              audioEngine.play('ui');
            }}
            className={`font-display relative rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              mode === m ? 'text-void' : 'text-white/55 hover:text-white/85'
            }`}
          >
            {mode === m && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan to-plasma"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative">{m === 'draw' ? 'Draw' : 'Objects'}</span>
          </button>
        ))}
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <div className="glass hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/50 sm:flex">
          <Activity size={11} className={fps > 45 ? 'text-green' : fps > 25 ? 'text-plasma' : 'text-pink'} />
          {fps || '--'} fps · {perf.tier}
        </div>
        <button
          onClick={() => {
            toggleHandSkeleton();
            audioEngine.play('ui');
          }}
          className={`glass flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
            showHandSkeleton ? 'border-cyan/60 text-cyan' : 'border-white/15 text-white/50'
          }`}
          title="Toggle hand skeleton overlay"
        >
          <Hand size={13} />
        </button>
        <button
          onClick={() => {
            toggleSound();
            audioEngine.setMuted(soundEnabled);
          }}
          className={`glass flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
            soundEnabled ? 'border-cyan/60 text-cyan' : 'border-white/15 text-white/50'
          }`}
          title="Toggle sound"
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
        <button
          onClick={() => {
            restartOnboarding();
            audioEngine.play('ui');
          }}
          className="glass flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/50 transition-colors hover:border-violet/50 hover:text-violet"
          title="Replay tutorial"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}
