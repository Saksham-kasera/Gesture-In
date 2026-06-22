import './shaders';

export function GridFloor() {
  return (
    <mesh position={[0, -5.2, -4]} rotation={[-Math.PI / 2.35, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[60, 60, 1, 1]} />
      {/* @ts-ignore */}
      <digitalGridMaterial transparent depthWrite={false} side={2} />
    </mesh>
  );
}
