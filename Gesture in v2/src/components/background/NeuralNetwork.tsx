import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Node {
  pos: THREE.Vector3;
  phase: number;
  speed: number;
  origin: THREE.Vector3;
}

export function NeuralNetwork({ count = 26 }: { count?: number }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.LineBasicMaterial>(null);

  const nodes = useMemo<Node[]>(() => {
    return Array.from({ length: count }, () => {
      const origin = new THREE.Vector3(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14 - 8
      );
      return { pos: origin.clone(), origin, phase: Math.random() * Math.PI * 2, speed: 0.15 + Math.random() * 0.2 };
    });
  }, [count]);

  const maxLinks = count * 4;
  const linePositions = useMemo(() => new Float32Array(maxLinks * 2 * 3), [maxLinks]);
  const pointPositions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    nodes.forEach((n, i) => {
      n.pos.set(
        n.origin.x + Math.sin(t * n.speed + n.phase) * 0.8,
        n.origin.y + Math.cos(t * n.speed * 0.8 + n.phase) * 0.8,
        n.origin.z + Math.sin(t * n.speed * 0.6 + n.phase) * 0.6
      );
      pointPositions[i * 3] = n.pos.x;
      pointPositions[i * 3 + 1] = n.pos.y;
      pointPositions[i * 3 + 2] = n.pos.z;
    });

    let linkCount = 0;
    outer: for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (linkCount >= maxLinks) break outer;
        const d = nodes[i].pos.distanceTo(nodes[j].pos);
        if (d < 6.2) {
          const o = linkCount * 6;
          linePositions[o] = nodes[i].pos.x;
          linePositions[o + 1] = nodes[i].pos.y;
          linePositions[o + 2] = nodes[i].pos.z;
          linePositions[o + 3] = nodes[j].pos.x;
          linePositions[o + 4] = nodes[j].pos.y;
          linePositions[o + 5] = nodes[j].pos.z;
          linkCount++;
        }
      }
    }
    for (let k = linkCount * 6; k < linePositions.length; k++) linePositions[k] = 0;

    if (lineRef.current) {
      const geom = lineRef.current.geometry;
      (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      geom.setDrawRange(0, linkCount * 2);
    }
    if (pointsRef.current) {
      (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
    if (matRef.current) {
      matRef.current.opacity = 0.25 + Math.sin(t * 0.8) * 0.08;
    }
  });

  return (
    <group>
      <lineSegments ref={lineRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={matRef} color="#35d4ff" transparent opacity={0.25} />
      </lineSegments>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#00f5ff" size={0.09} transparent opacity={0.8} sizeAttenuation />
      </points>
    </group>
  );
}
