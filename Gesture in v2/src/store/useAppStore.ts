import { create } from 'zustand';
import type { AppMode, InputMode, PerformanceProfile, AssistantTip } from '@/types';

export type OnboardingStep =
  | 'welcome'
  | 'permission'
  | 'calibration'
  | 'tutorial'
  | 'practice'
  | 'done';

interface AppState {
  onboardingStep: OnboardingStep;
  onboardingComplete: boolean;
  mode: AppMode;
  inputMode: InputMode;
  showHandSkeleton: boolean;
  showWebcamPreview: boolean;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  perf: PerformanceProfile;
  assistantOpen: boolean;
  assistantTips: AssistantTip[];
  trashActive: boolean;
  objectCount: number;
  lastGestureLabel: string;

  setOnboardingStep: (s: OnboardingStep) => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  setMode: (m: AppMode) => void;
  setInputMode: (m: InputMode) => void;
  toggleHandSkeleton: () => void;
  toggleWebcamPreview: () => void;
  toggleSound: () => void;
  toggleVoice: () => void;
  setPerfTier: (tier: PerformanceProfile['tier']) => void;
  toggleAssistant: () => void;
  pushTip: (text: string, priority?: number) => void;
  setTrashActive: (v: boolean) => void;
  setObjectCount: (n: number) => void;
  setLastGestureLabel: (s: string) => void;
}

const PERF_PROFILES: Record<PerformanceProfile['tier'], PerformanceProfile> = {
  high:   { tier: 'high',   particleCount: 600,  bloomEnabled: false, shadowsEnabled: false, dprCap: 1.5 },
  medium: { tier: 'medium', particleCount: 300,  bloomEnabled: false, shadowsEnabled: false, dprCap: 1 },
  low:    { tier: 'low',    particleCount: 120,  bloomEnabled: false, shadowsEnabled: false, dprCap: 1 },
};

let tipCounter = 0;

export const useAppStore = create<AppState>((set, get) => ({
  onboardingStep: 'welcome',
  onboardingComplete: false,
  mode: 'draw',
  inputMode: 'hand',
  showHandSkeleton: false,
  showWebcamPreview: true,
  soundEnabled: true,
  voiceEnabled: false,
  perf: PERF_PROFILES.medium,
  assistantOpen: false,
  assistantTips: [],
  trashActive: false,
  objectCount: 0,
  lastGestureLabel: '',

  setOnboardingStep: (s) => set({ onboardingStep: s }),
  completeOnboarding: () => set({ onboardingComplete: true, onboardingStep: 'done' }),
  restartOnboarding: () => set({ onboardingComplete: false, onboardingStep: 'welcome' }),
  setMode: (m) => set({ mode: m }),
  setInputMode: (m) => set({ inputMode: m }),
  toggleHandSkeleton: () => set((s) => ({ showHandSkeleton: !s.showHandSkeleton })),
  toggleWebcamPreview: () => set((s) => ({ showWebcamPreview: !s.showWebcamPreview })),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
  setPerfTier: (tier) => set({ perf: PERF_PROFILES[tier] }),
  toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),
  pushTip: (text, priority = 1) => {
    const id = `tip-${tipCounter++}`;
    const tip = { id, text, priority, expiresAt: Date.now() + 6000 };
    const current = get().assistantTips.filter((t) => !t.expiresAt || t.expiresAt > Date.now());
    set({ assistantTips: [...current.slice(-2), tip] });
  },
  setTrashActive: (v) => set({ trashActive: v }),
  setObjectCount: (n) => set({ objectCount: n }),
  setLastGestureLabel: (s) => set({ lastGestureLabel: s }),
}));
