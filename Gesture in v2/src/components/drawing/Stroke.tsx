import { useMemo } from 'react';
import * as THREE from 'three';
import type { Stroke as StrokeType } from '@/types';

interface StrokeProps {
  stroke: StrokeType;
}

export function StrokeMesh({ stroke }: StrokeProps) {
  const { coreGeo, haloGeo } = useMemo(() => {
    if (stroke.points.length < 2) return { coreGeo: null, haloGeo: null };

    const pts = stroke.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const segments = THREE.MathUtils.clamp(pts.length * 3, 8, 400);

    // Core tube — clearly visible solid line
    const coreRadius = 0.025 + stroke.size * 0.06;
    const coreGeo = new THREE.TubeGeometry(curve, segments, coreRadius, 6, false);

    // Halo — soft outer glow, only if glow is enabled
    const haloGeo = stroke.glow > 0.1
      ? new THREE.TubeGeometry(curve, Math.floor(segments * 0.6), coreRadius * (2.5 + stroke.glow * 2.0), 5, false)
      : null;

    return { coreGeo, haloGeo };
  }, [stroke.points.length, stroke.size, stroke.glow]);

  if (!coreGeo) return null;

  return (
    <group>
      {/* Solid core — full opacity, always readable */}
      <mesh geometry={coreGeo}>
        <meshBasicMaterial color={stroke.color} transparent={false} />
      </mesh>
      {/* Optional soft glow halo */}
      {haloGeo && (
        <mesh geometry={haloGeo}>
          <meshBasicMaterial
            color={stroke.color}
            transparent
            opacity={Math.min(0.35, 0.08 * stroke.glow + 0.06)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
