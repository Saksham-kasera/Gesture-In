import { useSceneStore } from '@/store/useSceneStore';
import { StrokeMesh } from './Stroke';

export function AirDrawingCanvas() {
  const strokes = useSceneStore((s) => s.strokes);
  return (
    <group>
      {strokes.map((s) => (
        <StrokeMesh key={s.id} stroke={s} />
      ))}
    </group>
  );
}
