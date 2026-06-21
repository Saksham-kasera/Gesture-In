import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffectsStore } from '@/store/useEffectsStore';
import type { EffectEvent } from '@/types';

const FRAGMENT_COUNT = 18;
const LIFETIME = 0.9;

function SingleBurst({ effect }: { effect: EffectEvent }) {
  const ref = useRef<THREE.Points>(null);
  const remove = useEffectsStore((s) => s.remove);
  const start = useRef(performance.now());

  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(FRAGMENT_COUNT * 3);
    const velocities = new Float32Array(FRAGMENT_COUNT * 3);
    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = effect.kind === 'merge' ? 0.6 + Math.random() * 0.6 : 1.8 + Math.random() * 2.6;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + (effect.kind === 'merge' ? 0 : 0.6);
      velocities[i * 3 + 2] = Math.cos(phi) * speed;
    }
    return [positions, velocities];
  }, [effect.kind]);

  useFrame(() => {
    const elapsed = (performance.now() - start.current) / 1000;
    if (elapsed > LIFETIME) {
      remove(effect.id);
      return;
    }
    const geom = ref.current?.geometry;
    if (!geom) return;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const dir = effect.kind === 'merge' ? -1 : 1;
    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const damp = effect.kind === 'merge' ? elapsed : 1 - elapsed * 0.4;
      pos.array[i * 3] = dir * velocities[i * 3] * elapsed * damp;
      pos.array[i * 3 + 1] = dir * velocities[i * 3 + 1] * elapsed * damp - (effect.kind === 'merge' ? 0 : 1.6 * elapsed * elapsed);
      pos.array[i * 3 + 2] = dir * velocities[i * 3 + 2] * elapsed * damp;
    }
    pos.needsUpdate = true;
    const mat = ref.current?.material as THREE.PointsMaterial;
    if (mat) mat.opacity = Math.max(0, 1 - elapsed / LIFETIME);
  });

  return (
    <points ref={ref} position={effect.position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={effect.color}
        size={effect.kind === 'spawn' ? 0.07 : 0.1}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function EffectsLayer() {
  const effects = useEffectsStore((s) => s.effects);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      useEffectsStore.setState((s) => ({
        effects: s.effects.filter((e) => now - e.createdAt < 2500),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {effects.map((e) => (
        <SingleBurst key={e.id} effect={e} />
      ))}
    </>
  );
}
