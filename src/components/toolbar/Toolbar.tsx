import { AnimatePresence, motion } from 'framer-motion';
import {
  Box, Circle, Triangle, Pill, Gem, Cylinder, Torus, Zap, Drone,
  Undo2, Redo2, Trash2, Camera, Droplet, Sun,
} from 'lucide-react';
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
  cube: Box, sphere: Circle, pyramid: Triangle, capsule: Pill,
  crystal: Gem, cylinder: Cylinder, torus: Torus, core: Zap, drone: Drone,
};

function IconBtn({
  onClick, title, children, accent = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-colors sm:h-8 sm:w-8"
      style={{
        background: accent ? 'rgba(138,46,255,0.2)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${accent ? 'rgba(138,46,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: accent ? '#a060ff' : 'rgba(255,255,255,0.7)',
      }}
    >
      {children}
    </motion.button>
  );
}

function Slider({ label, value, onChange, icon }: {
  label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {icon}<span>{label}</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.01} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full"
        style={{ accentColor: '#00f5ff', background: `linear-gradient(90deg, #00f5ff ${value * 100}%, rgba(255,255,255,0.12) ${value * 100}%)` }}
      />
    </div>
  );
}

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
    const position: [number, number, number] = hand ? hand.world : [(Math.random() - 0.5) * 1.2, 0.4, 0];
    spawnObject(kind, position);
    spawnFx('spawn', position, brush.color);
    audioEngine.play('spawn', position);
    pushTip(`${OBJECT_LABELS[kind]} — pinch it to pick it up`, 1);
  }

  function handleScreenshot() {
    const ok = captureCanvasScreenshot('gesturein');
    pushTip(ok ? 'Snapshot saved' : 'Capture failed — try again', 2);
    audioEngine.play('ui');
  }

  return (
    <div className="pointer-events-none fixed bottom-0 inset-x-0 z-30 flex justify-center pb-4 px-3">
      <div
        className="pointer-events-auto flex max-w-[98vw] flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5 sm:gap-3 sm:px-4"
        style={{
          background: 'rgba(6,2,18,0.88)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
        }}
      >
        <AnimatePresence mode="wait">
          {mode === 'draw' ? (
            <motion.div key="draw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-wrap items-center gap-2 sm:gap-3">
              <ColorPicker value={brush.color} onChange={setBrushColor} />
              <div className="h-6 w-px hidden sm:block" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <div className="flex gap-3 sm:gap-4">
                <Slider label="Size" value={brush.size} onChange={setBrushSize} icon={<Droplet size={9} />} />
                <Slider label="Glow" value={brush.glow} onChange={setBrushGlow} icon={<Sun size={9} />} />
                <Slider label="Fade" value={brush.opacity} onChange={setBrushOpacity} icon={<Droplet size={9} />} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="objects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1.5">
                {OBJECT_ORDER.map((kind) => {
                  const Icon = OBJECT_ICONS[kind];
                  return (
                    <IconBtn key={kind} onClick={() => handleSpawn(kind)} title={OBJECT_LABELS[kind]} accent>
                      <Icon size={13} />
                    </IconBtn>
                  );
                })}
              </div>
              <div className="h-6 w-px hidden sm:block" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <ColorPicker value={brush.color} onChange={setBrushColor} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-6 w-px hidden sm:block" style={{ background: 'rgba(255,255,255,0.12)' }} />

        <div className="flex items-center gap-1.5">
          <IconBtn onClick={undo} title="Undo"><Undo2 size={13} /></IconBtn>
          <IconBtn onClick={redo} title="Redo"><Redo2 size={13} /></IconBtn>
          <IconBtn onClick={clearAll} title="Clear all">
            <Trash2 size={13} style={{ color: '#ff6080' }} />
          </IconBtn>
          <IconBtn onClick={handleScreenshot} title="Screenshot">
            <Camera size={13} style={{ color: '#00f5ff' }} />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}
