import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import type { SceneObjectState } from '@/types';
import { registerObject, unregisterObject } from '@/lib/objectRegistry';
import { OBJECT_RADIUS } from './objectGeometries';
import './HologramMaterial';
import { ObjectAura } from './ObjectAura';

function ObjectGeometry({ kind }: { kind: SceneObjectState['kind'] }) {
  switch (kind) {
    case 'cube':
      return <boxGeometry args={[0.85, 0.85, 0.85]} />;
    case 'sphere':
      return <sphereGeometry args={[0.55, 32, 32]} />;
    case 'pyramid':
      return <coneGeometry args={[0.65, 0.95, 4]} />;
    case 'capsule':
      return <capsuleGeometry args={[0.35, 0.6, 8, 16]} />;
    case 'crystal':
      return <octahedronGeometry args={[0.65, 0]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.45, 0.45, 0.9, 24]} />;
    case 'torus':
      return <torusGeometry args={[0.5, 0.2, 16, 32]} />;
    case 'core':
      return <icosahedronGeometry args={[0.55, 1]} />;
    case 'drone':
      return <dodecahedronGeometry args={[0.55, 0]} />;
    default:
      return <boxGeometry args={[0.8, 0.8, 0.8]} />;
  }
}

interface HologramObjectProps {
  obj: SceneObjectState;
  selected: boolean;
}

export function HologramObject({ obj, selected }: HologramObjectProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<any>(null);
  const wireRef = useRef<any>(null);
  const spawnT = useRef(0);

  useEffect(() => {
    const entry = registerObject(obj.id, obj.kind);
    entry.rigidBody = rbRef.current;
    entry.mesh = meshRef.current;
    entry.liveScale = obj.scale;
    return () => unregisterObject(obj.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obj.id]);

  useEffect(() => {
    const entry = registerObject(obj.id, obj.kind);
    if (!entry.heldBy) entry.liveScale = obj.scale;
  }, [obj.id, obj.kind, obj.scale]);

  useFrame((state, delta) => {
    spawnT.current = Math.min(1, spawnT.current + delta * 2.2);
    const t = state.clock.elapsedTime;
    if (matRef.current) {
      matRef.current.uTime = t;
      matRef.current.uHighlight = selected ? 0.18 + Math.sin(t * 6) * 0.08 : 0;
    }
    const entry = registerObject(obj.id, obj.kind);
    entry.mesh = meshRef.current;
    if (meshRef.current) {
      const ease = 1 - Math.pow(1 - spawnT.current, 3);
      meshRef.current.scale.setScalar(entry.liveScale * ease);
      if (!entry.heldBy) {
        meshRef.current.rotation.y += delta * 0.25;
      }
    }
  });

  const radius = OBJECT_RADIUS[obj.kind];

  return (
    <RigidBody
      ref={rbRef}
      colliders="ball"
      position={obj.position}
      restitution={0.55}
      friction={0.3}
      linearDamping={0.4}
      angularDamping={0.6}
      enabledRotations={[false, false, false]}
      ccd
    >
      <mesh ref={meshRef} scale={0.001} castShadow>
        <ObjectGeometry kind={obj.kind} />
        {/* @ts-ignore */}
        <hologramMaterial
          ref={matRef}
          uColor={new THREE.Color(obj.color)}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
        <mesh ref={wireRef} scale={1.04}>
          <ObjectGeometry kind={obj.kind} />
          <meshBasicMaterial color={obj.color} wireframe transparent opacity={0.35} />
        </mesh>
      </mesh>
      <ObjectAura color={obj.color} radius={radius} />
    </RigidBody>
  );
}
