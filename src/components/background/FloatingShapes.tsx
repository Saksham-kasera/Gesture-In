import { Float } from '@react-three/drei';
import { useMemo } from 'react';

const SHAPES: Array<{ pos: [number, number, number]; geo: 'octa' | 'icosa' | 'torus'; scale: number; color: string }> = [
  { pos: [-7, 3, -10], geo: 'icosa', scale: 1.4, color: '#00f5ff' },
  { pos: [8, -2.5, -12], geo: 'octa', scale: 1.1, color: '#8a2eff' },
  { pos: [-5.5, -3.5, -8], geo: 'torus', scale: 0.9, color: '#35d4ff' },
  { pos: [6.5, 4, -14], geo: 'icosa', scale: 0.8, color: '#ff2ee0' },
  { pos: [0, 5.5, -16], geo: 'octa', scale: 1.6, color: '#8a2eff' },
];

function ShapeGeo({ kind }: { kind: string }) {
  if (kind === 'icosa') return <icosahedronGeometry args={[1, 0]} />;
  if (kind === 'torus') return <torusGeometry args={[1, 0.32, 8, 24]} />;
  return <octahedronGeometry args={[1, 0]} />;
}

export function FloatingShapes() {
  const shapes = useMemo(() => SHAPES, []);
  return (
    <>
      {shapes.map((s, i) => (
        <Float key={i} speed={0.6 + i * 0.1} rotationIntensity={0.6} floatIntensity={1.2} floatingRange={[-0.6, 0.6]}>
          <mesh position={s.pos} scale={s.scale}>
            <ShapeGeo kind={s.geo} />
            <meshBasicMaterial color={s.color} wireframe transparent opacity={0.18} />
          </mesh>
        </Float>
      ))}
    </>
  );
}
