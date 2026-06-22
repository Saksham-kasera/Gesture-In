import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import './shaders';

interface ParticleFieldProps {
  count?: number;
}

export function ParticleField({ count = 1400 }: ParticleFieldProps) {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<any>(null);
  const { viewport } = useThree();

  const [positions, sizes, seeds] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 32 - 8;
      sizes[i] = Math.random() * 1.4 + 0.3;
      seeds[i] = Math.random();
    }
    return [positions, sizes, seeds];
  }, [count]);

  useFrame((state) => {
    if (matRef.current) matRef.current.uTime = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.008;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <particleMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uPixelRatio={Math.min(viewport.dpr, 2)}
      />
    </points>
  );
}
