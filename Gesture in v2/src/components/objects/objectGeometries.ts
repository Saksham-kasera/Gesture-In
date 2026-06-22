import type { ObjectKind } from '@/types';

export const OBJECT_LABELS: Record<ObjectKind, string> = {
  cube: 'Cube',
  sphere: 'Sphere',
  pyramid: 'Pyramid',
  capsule: 'Capsule',
  crystal: 'Crystal',
  cylinder: 'Cylinder',
  torus: 'Torus',
  core: 'Energy Core',
  drone: 'Drone',
};

export const OBJECT_ORDER: ObjectKind[] = [
  'cube',
  'sphere',
  'pyramid',
  'capsule',
  'crystal',
  'cylinder',
  'torus',
  'core',
  'drone',
];

/** Base collider radius (approx) per kind, used for grab-distance + physics ball collider sizing */
export const OBJECT_RADIUS: Record<ObjectKind, number> = {
  cube: 0.5,
  sphere: 0.5,
  pyramid: 0.55,
  capsule: 0.55,
  crystal: 0.6,
  cylinder: 0.55,
  torus: 0.6,
  core: 0.5,
  drone: 0.65,
};
