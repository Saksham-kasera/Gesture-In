import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Circle,
  Triangle,
  Pill,
  Gem,
  Cylinder,
  Torus,
  Zap,
  Drone,
  Undo2,
  Redo2,
  Trash2,
  Camera,
  Droplet,
  Sun,
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { SliderControl } from '@/components/ui/SliderControl';
import { ColorPicker } from './ColorPicker';
import { useSceneStore } from '@/store/useSceneStore';
import { useAppStore } from '@/store/useAppStore';
import { useCursorStore } from '@/store/useCursorStore';
import { audioEngine } from '@/lib/audio';
import { captureCanvasScreenshot } from '@/lib/screenshot';
import { OBJECT_LABELS, OBJECT_ORDER } from '@/components/objects/objectGeometries';
import { useEffectsStore } from '@/store/useEffectsStore';
import type { ObjectKind } from '@/types';

const OBJECT_ICONS: Record<ObjectKind, React.ComponentType<{ size?: number }>> = {
  cube: Box,
  sphere: Circle,
  pyramid: Triangle,
  capsule: Pill,
  crystal: Gem,
  cylinder: Cylinder,
  torus: Torus,
  core: Zap,
  drone: Drone,
};

export function Toolbar() {
  const mode = useAppStore((s) => s.mode);
  const brush = useSceneStore((s) => s.brush);
  const setBrushColor = useSceneStore((s) => s.setBrushColor);
  const setBrushSize = useSceneStore((s) => s.setBrushSize);
  const setBrushGlow = useSceneStore((s) => s.setBrushGlow);
  const setBrushOpacity = useSceneStore((s) => s.setBrushOpacity);
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);
  const clearAll = useSceneStore((s) => s.clearAll);
  const spawnObject = useSceneStore((s) => s.spawnObject);
  const pushTip = useAppStore((s) => s.pushTip);
  const spawnFx = useEffectsStore((s) => s.spawn);

  function handleSpawn(kind: ObjectKind) {
    const right = useCursorStore.getState().right;
    const left = useCursorStore.getState().left;
    const hand = right.visible ? right : left.visible ? left : null;
    const position: [number, number, number] = hand ? hand.world : [(Math.random() - 0.5) * 1.4, 0.5, 0];
    spawnObject(kind, position);
    spawnFx('spawn', position, brush.color);
    audioEngine.play('spawn', position);
    pushTip(`${OBJECT_LABELS[kind]} materialized — pinch it to pick it up`, 1);
  }

  function handleScreenshot() {
    const ok = captureCanvasScreenshot('gesturein');
    pushTip(ok ? 'Snapshot saved to your downloads' : 'Could not capture — try again', 2);
    audioEngine.play('ui');
  }

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
      <GlassPanel className="pointer-events-auto flex max-w-[94vw] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
        <AnimatePresence mode="wait">
          {mode === 'draw' ? (
            <motion.div
              key="draw-controls"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-4 sm:gap-5"
            >
              <ColorPicker value={brush.color} onChange={setBrushColor} />
              <div className="hidden h-9 w-px bg-white/10 sm:block" />
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="w-28">
                  <SliderControl label="Size" value={brush.size} onChange={setBrushSize} icon={<Droplet size={11} />} />
                </div>
                <div className="w-28">
                  <SliderControl label="Glow" value={brush.glow} onChange={setBrushGlow} icon={<Sun size={11} />} accent="#8a2eff" />
                </div>
                <div className="w-28">
                  <SliderControl label="Opacity" value={brush.opacity} onChange={setBrushOpacity} icon={<Droplet size={11} />} accent="#ff2ee0" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="object-controls"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-4"
            >
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-9">
                {OBJECT_ORDER.map((kind) => {
                  const Icon = OBJECT_ICONS[kind];
                  return (
                    <NeonButton key={kind} size="sm" variant="violet" onClick={() => handleSpawn(kind)} title={OBJECT_LABELS[kind]}>
                      <Icon size={15} />
                    </NeonButton>
                  );
                })}
              </div>
              <div className="hidden h-9 w-px bg-white/10 sm:block" />
              <ColorPicker value={brush.color} onChange={setBrushColor} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="hidden h-9 w-px bg-white/10 sm:block" />

        <div className="flex items-center gap-2">
          <NeonButton size="sm" variant="ghost" onClick={undo} title="Undo">
            <Undo2 size={15} />
          </NeonButton>
          <NeonButton size="sm" variant="ghost" onClick={redo} title="Redo">
            <Redo2 size={15} />
          </NeonButton>
          <NeonButton size="sm" variant="pink" onClick={clearAll} title="Clear all">
            <Trash2 size={15} />
          </NeonButton>
          <NeonButton size="sm" variant="cyan" onClick={handleScreenshot} title="Save screenshot">
            <Camera size={15} />
          </NeonButton>
        </div>
      </GlassPanel>
    </div>
  );
}
