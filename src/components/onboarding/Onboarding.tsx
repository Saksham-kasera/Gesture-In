import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Sparkles, Pointer, Grab, X as XIcon, Layers } from 'lucide-react';
import { useAppStore, type OnboardingStep } from '@/store/useAppStore';
import { useHandStore } from '@/store/useHandStore';
import { useSceneStore } from '@/store/useSceneStore';
import { audioEngine } from '@/lib/audio';

const STEPS: OnboardingStep[] = ['welcome', 'permission', 'calibration', 'tutorial', 'practice'];

const GESTURES = [
  { icon: Pointer, name: 'Point', desc: 'Extend your index finger to paint light in the air', color: '#00f5ff' },
  { icon: Grab, name: 'Pinch', desc: 'Touch thumb to index to grab, scale, or erase', color: '#ff2ee0' },
  { icon: Hand, name: 'Open Palm', desc: 'Spread your fingers to pause and look around', color: '#8a2eff' },
  { icon: XIcon, name: 'Fist (other hand)', desc: 'Make a fist near a held object to crush it', color: '#ff5050' },
  { icon: Layers, name: 'Double Pinch', desc: 'Pinch twice quickly to duplicate an object', color: '#2eff9c' },
];

function ProgressDots({ step }: { step: OnboardingStep }) {
  const idx = STEPS.indexOf(step);
  return (
    <div className="mb-8 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <span
          key={s}
          className="h-1 rounded-full transition-all duration-300"
          style={{
            width: i === idx ? 28 : 8,
            background: i <= idx ? 'linear-gradient(90deg,#00f5ff,#8a2eff)' : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  );
}

export function Onboarding() {
  const step = useAppStore((s) => s.onboardingStep);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const setStep = useAppStore((s) => s.setOnboardingStep);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setMode = useAppStore((s) => s.setMode);
  const cameraReady = useHandStore((s) => s.cameraReady);
  const hands = useHandStore((s) => s.hands);
  const spawnObject = useSceneStore((s) => s.spawnObject);
  const [practiceSpawned, setPracticeSpawned] = useState(false);

  useEffect(() => {
    if (step === 'practice' && !practiceSpawned) {
      setMode('objects');
      spawnObject('crystal', [0, 0.3, 0]);
      setPracticeSpawned(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function go(next: OnboardingStep) {
    audioEngine.play('ui');
    setStep(next);
  }

  function finish() {
    audioEngine.play('spawn');
    setMode('draw');
    completeOnboarding();
  }

  if (onboardingComplete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 backdrop-blur-xl">
      <div className="noise-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
      <div className="flex w-full max-w-lg flex-col items-center px-6 text-center">
        <ProgressDots step={step} />

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan/40"
                style={{ boxShadow: '0 0 40px rgba(0,245,255,0.35)' }}
              >
                <Sparkles className="text-cyan" size={28} />
              </motion.div>
              <h1 className="font-display text-glow-cyan mb-3 text-4xl font-semibold tracking-tight text-white">
                Gesture<span className="text-cyan">In</span>
              </h1>
              <p className="mb-8 text-sm leading-relaxed text-white/60">
                A spatial computing workspace controlled entirely by your hands. Paint light in the
                air, summon holograms, and shape them with touchless gestures.
              </p>
              <button
                onClick={() => go('permission')}
                className="font-display rounded-full bg-gradient-to-r from-cyan to-violet px-8 py-3 text-sm font-medium uppercase tracking-wider text-void shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-transform hover:scale-105"
              >
                Begin
              </button>
            </motion.div>
          )}

          {step === 'permission' && (
            <motion.div
              key="permission"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-violet/40">
                <Hand className="text-violet" size={26} />
              </div>
              <h2 className="font-display mb-3 text-2xl font-medium text-white">Enable your camera</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/60">
                GestureIn tracks your hands locally in your browser to translate movement into
                gestures. Video never leaves your device.
              </p>
              <button
                onClick={() => go('calibration')}
                className="font-display rounded-full bg-gradient-to-r from-cyan to-violet px-8 py-3 text-sm font-medium uppercase tracking-wider text-void shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-transform hover:scale-105"
              >
                Allow Camera Access
              </button>
            </motion.div>
          )}

          {step === 'calibration' && (
            <motion.div
              key="calibration"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-display mb-3 text-2xl font-medium text-white">Calibrating</h2>
              <p className="mb-6 text-sm leading-relaxed text-white/60">
                Hold one hand up in view of your camera, fingers spread, about arm's length away.
              </p>
              <div className="mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-full border-2" style={{ borderColor: hands.length > 0 ? '#2eff9c' : 'rgba(255,255,255,0.2)' }}>
                <Hand className={hands.length > 0 ? 'text-green' : 'text-white/30'} size={36} />
              </div>
              <p className="mb-7 font-mono text-xs uppercase tracking-wider text-white/40">
                {!cameraReady ? 'Connecting to camera…' : hands.length > 0 ? 'Hand detected' : 'Waiting for hand…'}
              </p>
              <button
                disabled={!cameraReady}
                onClick={() => go('tutorial')}
                className="font-display rounded-full bg-gradient-to-r from-cyan to-violet px-8 py-3 text-sm font-medium uppercase tracking-wider text-void shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 'tutorial' && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <h2 className="font-display mb-5 text-2xl font-medium text-white">Your gestures</h2>
              <div className="mb-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {GESTURES.map((g) => (
                  <div key={g.name} className="glass flex items-start gap-3 rounded-xl p-3 text-left">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${g.color}1a`, color: g.color }}
                    >
                      <g.icon size={15} />
                    </div>
                    <div>
                      <div className="font-display text-xs font-medium text-white/90">{g.name}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-white/50">{g.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => go('practice')}
                className="font-display rounded-full bg-gradient-to-r from-cyan to-violet px-8 py-3 text-sm font-medium uppercase tracking-wider text-void shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-transform hover:scale-105"
              >
                Try it
              </button>
            </motion.div>
          )}

          {step === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-display mb-3 text-2xl font-medium text-white">Practice round</h2>
              <p className="mb-7 text-sm leading-relaxed text-white/60">
                A crystal has materialized in front of you. Pinch toward it to pick it up, move
                your hand to carry it, then release to set it down. When you're ready, step into
                your workspace.
              </p>
              <button
                onClick={finish}
                className="font-display rounded-full bg-gradient-to-r from-cyan to-violet px-8 py-3 text-sm font-medium uppercase tracking-wider text-void shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-transform hover:scale-105"
              >
                Enter Workspace
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 'welcome' && (
          <button
            onClick={finish}
            className="mt-7 font-mono text-[11px] uppercase tracking-wider text-white/30 transition-colors hover:text-white/60"
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}
