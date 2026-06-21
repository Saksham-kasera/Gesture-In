import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import './shaders';

export function GridFloor() {
  const matRef = useRef<any>(null);

  useFrame((state) => {
    if (matRef.current) matRef.current.uTime = state.clock.elapsedTime;
  });

  return (
    <mesh position={[0, -5.2, -4]} rotation={[-Math.PI / 2.35, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[60, 60, 1, 1]} />
      {/* @ts-ignore */}
      <digitalGridMaterial ref={matRef} transparent depthWrite={false} side={2} />
    </mesh>
  );
}
