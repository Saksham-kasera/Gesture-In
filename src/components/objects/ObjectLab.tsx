import { Physics, RigidBody } from '@react-three/rapier';
import { useSceneStore } from '@/store/useSceneStore';
import { useAppStore } from '@/store/useAppStore';
import { HologramObject } from './HologramObject';
import { TrashPortal } from './TrashPortal';
import { EffectsLayer } from './EffectsLayer';

export function ObjectLab() {
  const objects = useSceneStore((s) => s.objects);
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const mode = useAppStore((s) => s.mode);

  return (
    <Physics gravity={[0, -3.4, 0]} paused={mode !== 'objects'}>
      <RigidBody type="fixed" position={[0, -5.2, -4]} rotation={[-Math.PI / 2.35, 0, 0]} restitution={0.5} friction={0.4}>
        <CuboidFloor />
      </RigidBody>
      {/* invisible side walls keep thrown objects roughly within the workspace */}
      <RigidBody type="fixed" position={[-7, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 14, 14]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[7, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 14, 14]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      {objects.map((obj) => (
        <HologramObject key={obj.id} obj={obj} selected={obj.id === selectedObjectId} />
      ))}
      <TrashPortal />
      <EffectsLayer />
    </Physics>
  );
}

function CuboidFloor() {
  return (
    <mesh>
      <boxGeometry args={[30, 30, 0.2]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
