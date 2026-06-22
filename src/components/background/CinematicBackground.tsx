import { ParticleField } from './ParticleField';
import { GridFloor } from './GridFloor';
import { useAppStore } from '@/store/useAppStore';

export function CinematicBackground() {
  const perf = useAppStore((s) => s.perf);

  return (
    <group>
      <fog attach="fog" args={['#05000f', 14, 44]} />
      <color attach="background" args={['#05000f']} />
      <ambientLight intensity={0.08} color="#6020cc" />
      <pointLight position={[0, 8, 6]} intensity={0.15} color="#0088aa" distance={30} decay={2} />
      {perf.tier !== 'low' && <ParticleField count={perf.particleCount} />}
      <GridFloor />
    </group>
  );
}
