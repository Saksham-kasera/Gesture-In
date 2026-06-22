export function isCoarsePointerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: hover)').matches;
}

export function isSmallScreen(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 820;
}
