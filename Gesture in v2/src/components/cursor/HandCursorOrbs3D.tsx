import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCursorStore } from '@/store/useCursorStore';
import type { Handedness } from '@/types';

function gestureColor(gesture: string, isPinching: boolean): string {
  if (isPinching) return '#ff2ee0';
  if (gesture === 'point') return '#00f5ff';
  if (gesture === 'fist') return '#ff5050';
  if (gesture === 'open_palm') return '#8a2eff';
  return '#35d4ff';
}

function Orb({ handedness }: { handedness: Handedness }) {
  const ref = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const hand = handedness === 'Left' ? useCursorStore.getState().left : useCursorStore.getState().right;
    if (!ref.current) return;
    if (!hand.visible) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    ref.current.position.set(hand.world[0], hand.world[1], hand.world[2]);

    const color = gestureColor(hand.gesture, hand.isPinching);
    const scale = 0.07 + hand.pinchStrength * 0.05;
    if (coreRef.current) {
      coreRef.current.scale.setScalar(scale);
      (coreRef.current.material as THREE.MeshBasicMaterial).color.set(color);
    }
    if (ringRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.08;
      ringRef.current.scale.setScalar((0.16 + hand.pinchStrength * 0.1) * pulse);
      (ringRef.current.material as THREE.MeshBasicMaterial).color.set(color);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = hand.isPinching ? 0.85 : 0.4;
    }
  });

  return (
    <group ref={ref}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1, 32]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#00f5ff" intensity={0.6} distance={2} />
    </group>
  );
}

export function HandCursorOrbs3D() {
  return (
    <>
      <Orb handedness="Left" />
      <Orb handedness="Right" />
    </>
  );
}
