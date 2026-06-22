import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Sparkles, Pointer, Grab, X as XIcon, Layers } from 'lucide-react';
import { useAppStore, type OnboardingStep } from '@/store/useAppStore';
import { useHandStore } from '@/store/useHandStore';
import { useSceneStore } from '@/store/useSceneStore';
import { audioEngine } from '@/lib/audio';
import { isCoarsePointerDevice } from '@/lib/device';

const HAND_STEPS: OnboardingStep[] = ['welcome', 'permission', 'calibration', 'tutorial', 'practice'];
const TOUCH_STEPS: OnboardingStep[] = ['welcome', 'tutorial', 'practice'];

const GESTURES = [
  { icon: Pointer,  name: 'Point / Drag',  desc: 'Extend finger or drag on screen to paint in the air', color: '#00f5ff' },
  { icon: Grab,     name: 'Pinch / Tap',   desc: 'Pinch (or tap) near a hologram to grab it',           color: '#ff2ee0' },
  { icon: Hand,     name: 'Open palm',     desc: 'Spread fingers or lift to pause',                      color: '#8a2eff' },
  { icon: XIcon,    name: 'Fist (crush)',  desc: 'Other hand fist near a held object crushes it',        color: '#ff5050' },
  { icon: Layers,   name: 'Double pinch',  desc: 'Pinch twice quickly to duplicate',                     color: '#2eff9c' },
];

function ProgressDots({ step, steps }: { step: OnboardingStep; steps: OnboardingStep[] }) {
  const idx = steps.indexOf(step);
  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((s, i) => (
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
  const isTouch = isCoarsePointerDevice();
  const steps = isTouch ? TOUCH_STEPS : HAND_STEPS;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(5,0,15,0.88)', backdropFilter: 'blur(16px)' }}>
      <div className="flex w-full max-w-md flex-col items-center px-6 text-center">
        <ProgressDots step={step} steps={steps} />

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan/40"
                style={{ boxShadow: '0 0 24px rgba(0,245,255,0.2)' }}
              >
                <Sparkles className="text-cyan" size={24} />
              </motion.div>
              <h1 className="font-display mb-3 text-3xl font-semibold tracking-tight text-white">
                Gesture<span style={{ color: '#00f5ff' }}>In</span>
              </h1>
              <p className="mb-8 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {isTouch
                  ? 'A spatial workspace you control with touch. Drag to paint, tap to grab holograms.'
                  : 'A spatial workspace controlled by your hands. Paint light in the air, grab and sculpt holograms.'}
              </p>
              <button onClick={() => go(isTouch ? 'tutorial' : 'permission')}
                className="font-display rounded-full px-8 py-3 text-sm font-medium uppercase tracking-wider"
                style={{ background: 'linear-gradient(90deg,#00f5ff,#8a2eff)', color: '#05000f' }}>
                Get Started
              </button>
            </motion.div>
          )}

          {step === 'permission' && (
            <motion.div key="permission" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-violet/40">
                <Hand className="text-violet" size={22} />
              </div>
              <h2 className="font-display mb-3 text-2xl font-medium text-white">Camera access</h2>
              <p className="mb-8 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Hand tracking runs entirely in your browser. No video is ever uploaded or stored.
              </p>
              <button onClick={() => go('calibration')}
                className="font-display rounded-full px-8 py-3 text-sm font-medium uppercase tracking-wider"
                style={{ background: 'linear-gradient(90deg,#00f5ff,#8a2eff)', color: '#05000f' }}>
                Allow Camera
              </button>
            </motion.div>
          )}

          {step === 'calibration' && (
            <motion.div key="calibration" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <h2 className="font-display mb-2 text-2xl font-medium text-white">Hold up your hand</h2>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Fingers spread, about arm's length from the camera.
              </p>
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-2 transition-colors duration-300"
                   style={{ borderColor: hands.length > 0 ? '#2eff9c' : 'rgba(255,255,255,0.15)' }}>
                <Hand className="transition-colors duration-300" style={{ color: hands.length > 0 ? '#2eff9c' : 'rgba(255,255,255,0.25)' }} size={32} />
              </div>
              <p className="mb-6 font-mono text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {!cameraReady ? 'Connecting…' : hands.length > 0 ? '✓ Hand detected' : 'Waiting for hand…'}
              </p>
              <button disabled={!cameraReady} onClick={() => go('tutorial')}
                className="font-display rounded-full px-8 py-3 text-sm font-medium uppercase tracking-wider disabled:opacity-30"
                style={{ background: 'linear-gradient(90deg,#00f5ff,#8a2eff)', color: '#05000f' }}>
                Continue
              </button>
            </motion.div>
          )}

          {step === 'tutorial' && (
            <motion.div key="tutorial" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="w-full">
              <h2 className="font-display mb-5 text-2xl font-medium text-white">How it works</h2>
              <div className="mb-7 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GESTURES.filter((_, i) => isTouch ? i < 3 : true).map((g) => (
                  <div key={g.name} className="flex items-start gap-3 rounded-xl p-3 text-left"
                       style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                         style={{ background: `${g.color}20`, color: g.color }}>
                      <g.icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white/90">{g.name}</div>
                      <div className="mt-0.5 text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>{g.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => go('practice')}
                className="font-display rounded-full px-8 py-3 text-sm font-medium uppercase tracking-wider"
                style={{ background: 'linear-gradient(90deg,#00f5ff,#8a2eff)', color: '#05000f' }}>
                Try it
              </button>
            </motion.div>
          )}

          {step === 'practice' && (
            <motion.div key="practice" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <h2 className="font-display mb-3 text-2xl font-medium text-white">Practice</h2>
              <p className="mb-7 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                A crystal has appeared. {isTouch ? 'Tap near it to grab it, drag to move it.' : 'Pinch near it to pick it up, move your hand, release to drop it.'}
              </p>
              <button onClick={finish}
                className="font-display rounded-full px-8 py-3 text-sm font-medium uppercase tracking-wider"
                style={{ background: 'linear-gradient(90deg,#00f5ff,#8a2eff)', color: '#05000f' }}>
                Enter Workspace
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 'welcome' && (
          <button onClick={finish} className="mt-6 text-xs uppercase tracking-wider transition-colors" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
