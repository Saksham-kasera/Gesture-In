import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  float?: boolean;
}

export function GlassPanel({ children, className, float = false, ...rest }: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        'glass glass-border-glow rounded-2xl',
        float && 'animate-float-slow',
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
