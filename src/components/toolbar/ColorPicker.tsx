import { motion } from 'framer-motion';
import { NEON_PALETTE } from '@/lib/colors';
import { audioEngine } from '@/lib/audio';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2.5">
      {NEON_PALETTE.map((c) => (
        <motion.button
          key={c.hex}
          onClick={() => {
            onChange(c.hex);
            audioEngine.play('ui');
          }}
          whileHover={{ scale: 1.18, y: -2 }}
          whileTap={{ scale: 0.92 }}
          animate={{
            scale: value === c.hex ? 1.15 : 1,
            boxShadow: value === c.hex ? `0 0 16px ${c.hex}, 0 0 4px ${c.hex}` : `0 0 0px transparent`,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="relative h-6 w-6 rounded-full border border-white/30"
          style={{ background: c.hex }}
          aria-label={c.name}
          title={c.name}
        >
          {value === c.hex && (
            <motion.span
              layoutId="color-ring"
              className="absolute -inset-1.5 rounded-full border-2"
              style={{ borderColor: c.hex }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
