import type { HologramColor } from '@/types';

export const NEON_PALETTE: HologramColor[] = [
  { name: 'Cyan', hex: '#00f5ff' },
  { name: 'Violet', hex: '#8a2eff' },
  { name: 'Pink', hex: '#ff2ee0' },
  { name: 'Green', hex: '#2eff9c' },
  { name: 'White', hex: '#ffffff' },
];

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}
