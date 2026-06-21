import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

export const TRASH_POSITION: [number, number, number] = [4.6, -2.6, 0.5];
export const TRASH_RADIUS = 0.85;

export function TrashPortal() {
  const ref = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const active = useAppStore((s) => s.trashActive);
  const mode = useAppStore((s) => s.mode);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.z = t * (active ? 2.2 : 0.4);
      const targetScale = active ? 1.35 : 1;
      ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.18);
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = active ? 0.9 : 0.45 + Math.sin(t * 2) * 0.1;
    }
  });

  if (mode !== 'objects') return null;

  return (
    <group ref={ref} position={TRASH_POSITION}>
      <mesh ref={ringRef} rotation={[0, 0, 0]}>
        <torusGeometry args={[TRASH_RADIUS, 0.045, 12, 48]} />
        <meshBasicMaterial color={active ? '#ff2ee0' : '#8a2eff'} transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[TRASH_RADIUS * 0.7, 0.02, 8, 36]} />
        <meshBasicMaterial color="#ff2ee0" transparent opacity={active ? 0.7 : 0.25} />
      </mesh>
      <pointLight color={active ? '#ff2ee0' : '#8a2eff'} intensity={active ? 2.5 : 0.8} distance={3} />
    </group>
  );
}
