import { useMemo } from 'react';
import * as THREE from 'three';
import type { Stroke as StrokeType } from '@/types';

interface StrokeProps {
  stroke: StrokeType;
}

export function StrokeMesh({ stroke }: StrokeProps) {
  const geometry = useMemo(() => {
    if (stroke.points.length < 2) return null;
    const pts = stroke.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const segments = THREE.MathUtils.clamp(pts.length * 3, 8, 500);
    const radius = 0.012 + stroke.size * 0.05;
    return new THREE.TubeGeometry(curve, segments, radius, 6, false);
  }, [stroke.points.length, stroke.size]);

  const haloGeometry = useMemo(() => {
    if (stroke.points.length < 2) return null;
    const pts = stroke.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const segments = THREE.MathUtils.clamp(pts.length * 2, 6, 300);
    const radius = (0.012 + stroke.size * 0.05) * (1.8 + stroke.glow * 1.6);
    return new THREE.TubeGeometry(curve, segments, radius, 6, false);
  }, [stroke.points.length, stroke.size, stroke.glow]);

  if (!geometry) return null;

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={stroke.color} transparent opacity={stroke.opacity} />
      </mesh>
      {haloGeometry && (
        <mesh geometry={haloGeometry}>
          <meshBasicMaterial
            color={stroke.color}
            transparent
            opacity={0.16 * stroke.glow + 0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
