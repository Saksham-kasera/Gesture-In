import * as THREE from 'three';

const tmpVec = new THREE.Vector3();

/**
 * Projects a 2D screen-space point (px) through the given camera onto a
 * plane parallel to the camera's view at world-space depth `planeZ`.
 * This is what turns the flat hand-tracking cursor into a true 3D point
 * the user can push and pull through depth.
 */
export function screenToWorld(
  camera: THREE.Camera,
  screenX: number,
  screenY: number,
  viewportW: number,
  viewportH: number,
  planeZ: number
): [number, number, number] {
  const ndcX = (screenX / viewportW) * 2 - 1;
  const ndcY = -(screenY / viewportH) * 2 + 1;

  tmpVec.set(ndcX, ndcY, 0.5).unproject(camera);
  const dir = tmpVec.sub(camera.position).normalize();

  if (Math.abs(dir.z) < 1e-6) {
    return [camera.position.x, camera.position.y, planeZ];
  }

  const distance = (planeZ - camera.position.z) / dir.z;
  const result = camera.position.clone().add(dir.multiplyScalar(distance));
  return [result.x, result.y, result.z];
}

/** Maps a 0..1 hand-depth reading to a usable world Z range for the interaction plane. */
export function depthToPlaneZ(depth: number): number {
  // depth: 0 = close to camera, 1 = far. Closer hand -> drawing plane nearer the camera (larger, more present).
  return THREE.MathUtils.lerp(2.2, -1.8, depth);
}
