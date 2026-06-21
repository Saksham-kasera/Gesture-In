import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useHandStore } from '@/store/useHandStore';
import { useCursorStore } from '@/store/useCursorStore';
import { useAppStore } from '@/store/useAppStore';
import { useSceneStore } from '@/store/useSceneStore';
import { useEffectsStore } from '@/store/useEffectsStore';
import { objectRegistry } from '@/lib/objectRegistry';
import { screenToWorld, depthToPlaneZ } from '@/lib/projection';
import { audioEngine } from '@/lib/audio';
import { OBJECT_RADIUS } from '@/components/objects/objectGeometries';
import { TRASH_POSITION, TRASH_RADIUS } from '@/components/objects/TrashPortal';
import type { Handedness } from '@/types';

const GRAB_RADIUS = 1.05;
const CRUSH_RADIUS = 1.0;
const MERGE_RADIUS = 0.85;
const MIN_DRAW_DIST = 0.035;
const ERASE_RADIUS = 0.4;
const HOLD_LERP = 0.38;
const THROW_VELOCITY_SCALE = 0.0026;
const THROW_FAST_THRESHOLD = 1400; // px/sec
const PX_TO_WORLD_SPEED = 0.0026;

interface HandRuntime {
  drawingStrokeId: string | null;
  lastDrawPoint: THREE.Vector3 | null;
  heldObjectId: string | null;
  wasPinching: boolean;
  grabOffset: THREE.Vector3;
}

function makeHandRuntime(): HandRuntime {
  return {
    drawingStrokeId: null,
    lastDrawPoint: null,
    heldObjectId: null,
    wasPinching: false,
    grabOffset: new THREE.Vector3(),
  };
}

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

export function InteractionController() {
  const { camera, size } = useThree();
  const runtimes = useRef<Record<Handedness, HandRuntime>>({
    Left: makeHandRuntime(),
    Right: makeHandRuntime(),
  });
  const twoHand = useRef<{ objectId: string; initialDist: number; initialScale: number } | null>(null);

  useFrame(() => {
    const hands = useHandStore.getState().hands;
    const mode = useAppStore.getState().mode;
    const scene = useSceneStore.getState();
    const effects = useEffectsStore.getState();
    const appActions = useAppStore.getState();

    const worldByHand: Partial<Record<Handedness, THREE.Vector3>> = {};
    const dataByHand: Partial<Record<Handedness, (typeof hands)[number]>> = {};

    (['Left', 'Right'] as Handedness[]).forEach((handedness) => {
      const handData = hands.find((h) => h.handedness === handedness);
      const rt = runtimes.current[handedness];

      if (!handData) {
        useCursorStore.getState().setHand(handedness, {
          screen: { x: 0, y: 0 },
          world: [0, 0, 0],
          gesture: 'none',
          isPinching: false,
          pinchStrength: 0,
          velocity: { x: 0, y: 0 },
          speed: 0,
          visible: false,
        });
        if (rt.heldObjectId) {
          releaseObject(rt, handedness, scene, effects, appActions, { x: 0, y: 0 });
        }
        rt.drawingStrokeId = null;
        rt.lastDrawPoint = null;
        return;
      }

      const planeZ = depthToPlaneZ(handData.depth);
      const world = screenToWorld(camera, handData.screenPosition.x, handData.screenPosition.y, size.width, size.height, planeZ);
      const worldVec = new THREE.Vector3(...world);
      worldByHand[handedness] = worldVec;
      dataByHand[handedness] = handData;

      const speed = Math.hypot(handData.velocity.x, handData.velocity.y);

      useCursorStore.getState().setHand(handedness, {
        screen: handData.screenPosition,
        world,
        gesture: handData.gesture,
        isPinching: handData.isPinching,
        pinchStrength: handData.pinchStrength,
        velocity: handData.velocity,
        speed,
        visible: true,
      });

      // ---------------- DRAW MODE ----------------
      if (mode === 'draw') {
        if (handData.gesture === 'point') {
          if (!rt.drawingStrokeId) {
            rt.drawingStrokeId = scene.startStroke({ x: worldVec.x, y: worldVec.y, z: worldVec.z });
            rt.lastDrawPoint = worldVec.clone();
            audioEngine.play('spawn', world, 0.4);
          } else if (rt.lastDrawPoint && rt.lastDrawPoint.distanceTo(worldVec) > MIN_DRAW_DIST) {
            scene.appendToStroke(rt.drawingStrokeId, { x: worldVec.x, y: worldVec.y, z: worldVec.z });
            rt.lastDrawPoint = worldVec.clone();
          }
        } else {
          if (rt.drawingStrokeId) {
            scene.finishStroke(rt.drawingStrokeId);
            rt.drawingStrokeId = null;
            rt.lastDrawPoint = null;
          }
          if (handData.gesture === 'pinch') {
            const strokes = useSceneStore.getState().strokes;
            for (const st of strokes) {
              const hit = st.points.some(
                (p) => Math.hypot(p.x - worldVec.x, p.y - worldVec.y, p.z - worldVec.z) < ERASE_RADIUS
              );
              if (hit) {
                scene.removeStroke(st.id);
                audioEngine.play('break', world, 0.3);
                break;
              }
            }
          }
        }
      }

      // ---------------- OBJECTS MODE ----------------
      if (mode === 'objects') {
        const risingEdge = handData.isPinching && !rt.wasPinching;
        const fallingEdge = !handData.isPinching && rt.wasPinching;

        if (handData.gesture === 'double_pinch') {
          const targetId = rt.heldObjectId ?? findNearestObject(worldVec, GRAB_RADIUS, null);
          if (targetId) {
            const newId = scene.duplicateObject(targetId);
            if (newId) {
              const color = scene.objects.find((o) => o.id === newId)?.color ?? '#00f5ff';
              effects.spawn('spawn', world, color);
              audioEngine.play('duplicate', world);
              appActions.pushTip('Duplicated — two pinches makes a perfect copy', 2);
            }
          }
        }

        if (risingEdge && !rt.heldObjectId) {
          const nearestId = findNearestObject(worldVec, GRAB_RADIUS, null);
          if (nearestId) {
            const entry = objectRegistry.get(nearestId);
            if (entry && entry.heldBy && entry.heldBy !== handedness) {
              const otherWorld = worldByHand[entry.heldBy] ?? worldVec;
              twoHand.current = {
                objectId: nearestId,
                initialDist: Math.max(0.1, worldVec.distanceTo(otherWorld)),
                initialScale: entry.liveScale,
              };
              rt.heldObjectId = nearestId;
              appActions.pushTip('Two hands — pull apart to scale', 2);
            } else if (entry && !entry.heldBy) {
              entry.heldBy = handedness;
              entry.rigidBody?.setBodyType(2 as any, true);
              rt.heldObjectId = nearestId;
              scene.setSelectedObject(nearestId);
              audioEngine.play('grab', world);
              appActions.pushTip('Move your hand to carry it through space', 1);
            }
          }
        }

        if (rt.heldObjectId) {
          const entry = objectRegistry.get(rt.heldObjectId);
          const isTwoHand = twoHand.current?.objectId === rt.heldObjectId;

          if (entry?.rigidBody) {
            if (isTwoHand && twoHand.current) {
              const otherHandedness: Handedness = handedness === 'Left' ? 'Right' : 'Left';
              const otherWorld = worldByHand[otherHandedness];
              if (otherWorld && handedness === 'Right') {
                const dist = Math.max(0.1, worldVec.distanceTo(otherWorld));
                const scale = THREE.MathUtils.clamp(
                  twoHand.current.initialScale * (dist / twoHand.current.initialDist),
                  0.35,
                  3.2
                );
                entry.liveScale = scale;
                const mid = tmpA.copy(worldVec).add(otherWorld).multiplyScalar(0.5);
                entry.rigidBody.setNextKinematicTranslation({ x: mid.x, y: mid.y, z: mid.z });
              }
            } else if (!isTwoHand) {
              const current = entry.rigidBody.translation();
              tmpB.set(current.x, current.y, current.z).lerp(worldVec, HOLD_LERP);
              entry.rigidBody.setNextKinematicTranslation({ x: tmpB.x, y: tmpB.y, z: tmpB.z });
            }
          }

          const otherHandedness2: Handedness = handedness === 'Left' ? 'Right' : 'Left';
          const otherData = dataByHand[otherHandedness2] ?? hands.find((h) => h.handedness === otherHandedness2);
          const otherWorld2 = worldByHand[otherHandedness2];
          if (!isTwoHand && otherData?.gesture === 'fist' && otherWorld2 && entry) {
            const objPos = entry.rigidBody?.translation();
            if (objPos) {
              const d = Math.hypot(objPos.x - otherWorld2.x, objPos.y - otherWorld2.y, objPos.z - otherWorld2.z);
              if (d < CRUSH_RADIUS) {
                const color = scene.objects.find((o) => o.id === rt.heldObjectId)?.color ?? '#ff2ee0';
                effects.spawn('burst', [objPos.x, objPos.y, objPos.z], color);
                audioEngine.play('break', [objPos.x, objPos.y, objPos.z], 1);
                scene.removeObject(rt.heldObjectId);
                entry.heldBy = null;
                rt.heldObjectId = null;
                twoHand.current = null;
                appActions.pushTip('Crushed — two hands can destroy as well as create', 2);
              }
            }
          }

          if (rt.heldObjectId) {
            const objPos = objectRegistry.get(rt.heldObjectId)?.rigidBody?.translation();
            if (objPos) {
              const dTrash = Math.hypot(objPos.x - TRASH_POSITION[0], objPos.y - TRASH_POSITION[1], objPos.z - TRASH_POSITION[2]);
              appActions.setTrashActive(dTrash < TRASH_RADIUS * 1.4);
            }
          }
        }

        if (fallingEdge && rt.heldObjectId) {
          releaseObject(rt, handedness, scene, effects, appActions, handData.velocity);
          twoHand.current = null;
        }

        rt.wasPinching = handData.isPinching;
      }
    });

    if (mode === 'objects') {
      const leftRt = runtimes.current.Left;
      const rightRt = runtimes.current.Right;
      if (
        leftRt.heldObjectId &&
        rightRt.heldObjectId &&
        leftRt.heldObjectId !== rightRt.heldObjectId &&
        !twoHand.current
      ) {
        const leftEntry = objectRegistry.get(leftRt.heldObjectId);
        const rightEntry = objectRegistry.get(rightRt.heldObjectId);
        const lp = leftEntry?.rigidBody?.translation();
        const rp = rightEntry?.rigidBody?.translation();
        if (lp && rp) {
          const d = Math.hypot(lp.x - rp.x, lp.y - rp.y, lp.z - rp.z);
          if (d < MERGE_RADIUS) {
            const mid: [number, number, number] = [(lp.x + rp.x) / 2, (lp.y + rp.y) / 2, (lp.z + rp.z) / 2];
            const leftObj = scene.objects.find((o) => o.id === leftRt.heldObjectId);
            const rightObj = scene.objects.find((o) => o.id === rightRt.heldObjectId);
            const newScale = ((leftObj?.scale ?? 1) + (rightObj?.scale ?? 1)) * 0.75;
            const kind = leftObj?.kind ?? 'core';
            const color = leftObj?.color ?? '#00f5ff';

            scene.removeObject(leftRt.heldObjectId);
            scene.removeObject(rightRt.heldObjectId);
            if (leftEntry) leftEntry.heldBy = null;
            if (rightEntry) rightEntry.heldBy = null;
            leftRt.heldObjectId = null;
            rightRt.heldObjectId = null;

            const mergedId = scene.spawnObject(kind, mid);
            scene.updateObjectTransform(mergedId, mid, newScale);
            effects.spawn('merge', mid, color);
            audioEngine.play('spawn', mid, 1.2);
            appActions.pushTip('Merged into one — bring objects together to fuse them', 2);
          }
        }
      }
    }
  });

  return null;
}

function findNearestObject(worldPos: THREE.Vector3, radius: number, excludeHeldBy: Handedness | null): string | null {
  let nearestId: string | null = null;
  let nearestDist = radius;
  objectRegistry.forEach((entry, id) => {
    if (entry.heldBy && entry.heldBy === excludeHeldBy) return;
    if (!entry.mesh && !entry.rigidBody) return;
    let pos: THREE.Vector3;
    if (entry.rigidBody) {
      const t = entry.rigidBody.translation();
      pos = tmpA.set(t.x, t.y, t.z);
    } else if (entry.mesh) {
      pos = entry.mesh.getWorldPosition(tmpA);
    } else {
      return;
    }
    const d = pos.distanceTo(worldPos) - (OBJECT_RADIUS[entry.kind] ?? 0.5) * 0.4;
    if (d < nearestDist) {
      nearestDist = d;
      nearestId = id;
    }
  });
  return nearestId;
}

function releaseObject(
  rt: HandRuntime,
  handedness: Handedness,
  scene: ReturnType<typeof useSceneStore.getState>,
  effects: ReturnType<typeof useEffectsStore.getState>,
  appActions: ReturnType<typeof useAppStore.getState>,
  velocityPx: { x: number; y: number }
) {
  const id = rt.heldObjectId;
  if (!id) return;
  const entry = objectRegistry.get(id);
  if (entry && entry.heldBy === handedness) {
    entry.heldBy = null;
  }
  rt.heldObjectId = null;

  if (!entry?.rigidBody) return;

  const pos = entry.rigidBody.translation();
  const dTrash = Math.hypot(pos.x - TRASH_POSITION[0], pos.y - TRASH_POSITION[1], pos.z - TRASH_POSITION[2]);

  if (dTrash < TRASH_RADIUS) {
    const color = scene.objects.find((o) => o.id === id)?.color ?? '#8a2eff';
    effects.spawn('burst', [pos.x, pos.y, pos.z], color);
    audioEngine.play('delete', [pos.x, pos.y, pos.z]);
    scene.removeObject(id);
    appActions.setTrashActive(false);
    appActions.pushTip('Deleted — dropped right into the portal', 1);
    return;
  }

  entry.rigidBody.setBodyType(0 as any, true);
  const speed = Math.hypot(velocityPx.x, velocityPx.y);
  const vx = velocityPx.x * THROW_VELOCITY_SCALE;
  const vy = -velocityPx.y * PX_TO_WORLD_SPEED;
  entry.rigidBody.setLinvel({ x: vx, y: vy + 0.4, z: -speed * 0.0008 }, true);

  if (speed > THROW_FAST_THRESHOLD) {
    const color = scene.objects.find((o) => o.id === id)?.color ?? '#00f5ff';
    effects.spawn('burst', [pos.x, pos.y, pos.z], color);
    audioEngine.play('throw', [pos.x, pos.y, pos.z], Math.min(2, speed / THROW_FAST_THRESHOLD));
  } else {
    audioEngine.play('release', [pos.x, pos.y, pos.z]);
  }
  appActions.setTrashActive(false);
}
