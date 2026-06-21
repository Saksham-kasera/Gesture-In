import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Volume2, VolumeX } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { audioEngine } from '@/lib/audio';

export function AIAssistant() {
  const open = useAppStore((s) => s.assistantOpen);
  const toggle = useAppStore((s) => s.toggleAssistant);
  const tips = useAppStore((s) => s.assistantTips);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const toggleVoice = useAppStore((s) => s.toggleVoice);
  const mode = useAppStore((s) => s.mode);
  const lastSpoken = useRef<string | null>(null);
  const [pulse, setPulse] = useState(false);

  const visibleTips = [...tips].sort((a, b) => b.priority - a.priority).slice(-4).reverse();
  const latest = tips[tips.length - 1];

  useEffect(() => {
    if (!latest) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1400);
    if (voiceEnabled && latest.id !== lastSpoken.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      lastSpoken.current = latest.id;
      const utter = new SpeechSynthesisUtterance(latest.text.replace(/—/g, ','));
      utter.rate = 1.05;
      utter.pitch = 0.85;
      utter.volume = 0.7;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => /en-(US|GB)/.test(v.lang) && /male|daniel|google uk english male/i.test(v.name));
      if (preferred) utter.voice = preferred;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  return (
    <div className="pointer-events-none fixed bottom-28 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="glass glass-border-glow pointer-events-auto w-72 overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
                </span>
                <span className="font-display text-xs uppercase tracking-[0.2em] text-cyan/90">Aria</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    toggleVoice();
                    audioEngine.play('ui');
                  }}
                  className="rounded-md p-1 text-white/40 transition-colors hover:text-cyan"
                  title={voiceEnabled ? 'Voice on' : 'Voice off'}
                >
                  {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <button
                  onClick={() => {
                    toggle();
                    audioEngine.play('ui');
                  }}
                  className="rounded-md p-1 text-white/40 transition-colors hover:text-pink"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
            <div className="flex max-h-52 flex-col gap-2 overflow-y-auto px-4 py-3">
              {visibleTips.length === 0 ? (
                <p className="font-mono text-[11px] leading-relaxed text-white/40">
                  {mode === 'draw'
                    ? 'Point your index finger to paint light in the air. Pinch to erase.'
                    : 'Pinch near a hologram to pick it up. Try two hands for scale.'}
                </p>
              ) : (
                <AnimatePresence initial={false}>
                  {visibleTips.map((tip) => (
                    <motion.p
                      key={tip.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      className="font-mono text-[11px] leading-relaxed text-white/70"
                    >
                      {tip.text}
                    </motion.p>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => {
          toggle();
          audioEngine.play('ui');
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={pulse ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.5 }}
        className="glass pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan/40 text-cyan shadow-[0_0_22px_rgba(0,245,255,0.35)]"
      >
        <Sparkles size={18} />
        {!open && latest && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-pink shadow-[0_0_8px_rgba(255,46,224,0.9)]" />
        )}
      </motion.button>
    </div>
  );
}
