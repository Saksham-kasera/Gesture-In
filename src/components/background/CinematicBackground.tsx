import { ParticleField } from './ParticleField';
import { GridFloor } from './GridFloor';
import { NeuralNetwork } from './NeuralNetwork';
import { FloatingShapes } from './FloatingShapes';
import { useAppStore } from '@/store/useAppStore';

export function CinematicBackground() {
  const perf = useAppStore((s) => s.perf);

  return (
    <group>
      <fog attach="fog" args={['#090016', 8, 34]} />
      <color attach="background" args={['#090016']} />
      <ambientLight intensity={0.35} color="#8a2eff" />
      <pointLight position={[4, 6, 4]} intensity={1.1} color="#00f5ff" distance={26} decay={1.5} />
      <pointLight position={[-6, -2, 2]} intensity={0.7} color="#8a2eff" distance={22} decay={1.5} />
      <ParticleField count={perf.particleCount} />
      <GridFloor />
      {perf.tier !== 'low' && <NeuralNetwork count={perf.tier === 'high' ? 26 : 16} />}
      {perf.tier === 'high' && <FloatingShapes />}
    </group>
  );
}
