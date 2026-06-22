import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { audioEngine } from '@/lib/audio';

interface NeonButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  children: ReactNode;
  active?: boolean;
  variant?: 'cyan' | 'violet' | 'pink' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  magnetic?: boolean;
}

const VARIANT_STYLES: Record<string, string> = {
  cyan: 'border-cyan/50 text-cyan shadow-[0_0_18px_rgba(0,245,255,0.25)] hover:shadow-[0_0_28px_rgba(0,245,255,0.55)]',
  violet:
    'border-violet/50 text-violet shadow-[0_0_18px_rgba(138,46,255,0.25)] hover:shadow-[0_0_28px_rgba(138,46,255,0.55)]',
  pink: 'border-pink/50 text-pink shadow-[0_0_18px_rgba(255,46,224,0.25)] hover:shadow-[0_0_28px_rgba(255,46,224,0.55)]',
  ghost: 'border-white/15 text-white/80 hover:border-cyan/40 hover:text-cyan',
};

const SIZE_STYLES: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3.5 text-base gap-2.5',
};

export function NeonButton({
  children,
  active,
  variant = 'cyan',
  size = 'md',
  magnetic = true,
  className,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
  ...rest
}: NeonButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.94 }}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.4 }}
      onMouseMove={(e) => {
        if (magnetic && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          setOffset({ x: (e.clientX - cx) * 0.18, y: (e.clientY - cy) * 0.18 });
        }
        onMouseMove?.(e);
      }}
      onMouseEnter={(e) => {
        audioEngine.play('hover');
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setOffset({ x: 0, y: 0 });
        onMouseLeave?.(e);
      }}
      onClick={(e) => {
        audioEngine.play('ui');
        onClick?.(e);
      }}
      className={cn(
        'font-display relative inline-flex items-center justify-center rounded-xl border backdrop-blur-md transition-colors duration-200',
        'bg-white/[0.03] hover:bg-white/[0.07]',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        active && 'bg-white/10',
        className
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
