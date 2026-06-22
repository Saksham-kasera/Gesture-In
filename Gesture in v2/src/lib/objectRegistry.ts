import type { RapierRigidBody } from '@react-three/rapier';
import type * as THREE from 'three';
import type { ObjectKind } from '@/types';

export interface RegisteredObject {
  rigidBody: RapierRigidBody | null;
  mesh: THREE.Object3D | null;
  kind: ObjectKind;
  heldBy: 'Left' | 'Right' | null;
  liveScale: number;
}

export const objectRegistry = new Map<string, RegisteredObject>();

export function registerObject(id: string, kind: ObjectKind) {
  if (!objectRegistry.has(id)) {
    objectRegistry.set(id, { rigidBody: null, mesh: null, kind, heldBy: null, liveScale: 1 });
  }
  return objectRegistry.get(id)!;
}

export function unregisterObject(id: string) {
  objectRegistry.delete(id);
}
