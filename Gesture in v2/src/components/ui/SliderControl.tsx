import { useId } from 'react';
import { cn } from '@/lib/cn';

interface SliderControlProps {
  label: string;
  value: number; // 0..1
  onChange: (v: number) => void;
  icon?: React.ReactNode;
  accent?: string;
}

export function SliderControl({ label, value, onChange, icon, accent = '#00f5ff' }: SliderControlProps) {
  const id = useId();
  const pct = Math.round(value * 100);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/55">
        <label htmlFor={id} className="flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        <span className="text-white/75">{pct}%</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, #8a2eff)`, boxShadow: `0 0 12px ${accent}88` }}
        />
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className={cn(
            'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent',
            '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,245,255,0.9)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-cyan/70'
          )}
        />
      </div>
    </div>
  );
}
