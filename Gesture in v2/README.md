# GestureIn

A spatial gesture-computing workspace for the browser. Point to paint light in
the air, pinch to summon and manipulate holographic 3D objects, and drive it
all with nothing but your webcam and your hands.

Built with **React 19 + TypeScript + Vite**, **React Three Fiber / Three.js**
(rendering, physics via Rapier, postprocessing bloom/vignette/film grain),
**MediaPipe Hands** (on-device hand tracking, nothing ever leaves the
browser), **Zustand** (state), and **Framer Motion** (UI choreography). Every
sound effect is synthesized live with the Web Audio API — there are zero
audio assets in this project.

## Running it

```bash
npm install
npm run dev       # local dev server
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
```

Requires a webcam and a browser with WebGL2 + getUserMedia support (any
recent Chrome, Edge, or Safari). No backend, no API keys, nothing to
configure.

## How it's organized

```
src/
  components/
    background/   cinematic particle field, neural net, grid floor, shapes
    cursor/       3D hand orbs + the DOM-overlay neon trail/ripple cursor
    drawing/      air-drawing stroke rendering (glowing tube geometry)
    objects/      holographic 3D objects, physics, trash portal, VFX bursts
    onboarding/   welcome -> permission -> calibration -> tutorial -> practice
    scene/        the R3F <Canvas>, top bar, and the gesture InteractionController
    toolbar/      bottom dock: colors, brush controls, object spawner, undo/redo
    webcam/       camera provider + the picture-in-picture skeleton preview
    assistant/    "Aria", the floating contextual-tips assistant
    mobile/       touch-input fallback for devices without a usable camera
  hooks/useHandTracking.ts   the core MediaPipe + smoothing + gesture loop
  lib/            smoothing filters, gesture classification, audio engine,
                  projection math, physics-object registry, screenshot export
  store/          Zustand stores: hand tracking, app/UI, scene content,
                  cursor projections, transient VFX events
```

The gesture pipeline, end to end: `useHandTracking` pulls frames from a
hidden `<video>`, runs MediaPipe's `HandLandmarker`, smooths all 21 landmarks
per hand through a One Euro Filter (jitter-free without feeling laggy),
classifies a gesture from the smoothed landmarks, and writes the result into
`useHandStore`. Every frame, `InteractionController` (living inside the R3F
render loop) reads that state, projects each hand from screen space into a 3D
point in the scene, and drives drawing, grabbing, scaling, throwing, merging,
duplicating, and deleting — all without going through React's render cycle,
so it stays smooth even with two hands and a dozen objects in play.

## Gestures

| Gesture | Effect |
|---|---|
| Point (index extended) | Draw, in Draw mode |
| Pinch (thumb + index) | Grab an object, scale it (two hands), or erase a stroke |
| Open palm | Pause / no-op |
| Fist, on your *other* hand, near something you're holding | Crush it |
| Two quick pinches in a row | Duplicate the nearest object |
| Bring two held objects together | Merge them into one |
| Release fast | Throw, with a velocity-matched burst effect |
| Release over the portal (bottom right) | Delete |

## Honest simplifications

This was built to be a real, working app rather than a slide deck, which
meant making some calls about what to simplify:

- **Crush** is recognized as your *other* hand making a fist near an object
  you're already pinching — there's no reliable way to distinguish a
  "crushing pinch" from a normal pinch using raw landmark positions alone, so
  a second-hand fist became the trigger instead.
- **"Explode"** isn't a separate gesture. It reuses the crush/burst VFX
  pipeline: a fast-velocity throw also fires a small burst effect, and a
  crush fires a bigger one. Distinct visual language, shared engine.
- **Two-hand rotation** is applied directly to the mesh for feel, but isn't
  written back into the object's saved state or undo history — only position
  and scale are persisted. Rotating a held object is momentary flourish, not
  a tracked transform.
- **Screenshot and "export artwork"** are the same capture pipeline: a PNG
  grab of the live WebGL canvas (`preserveDrawingBuffer: true` is enabled
  specifically for this).
- **Touch fallback** maps a single finger to one synthetic "Right hand":
  drag-to-draw in Draw mode, drag-to-grab in Objects mode. It's a deliberately
  small surface area, not a full second input scheme.
- **Hand-tracking video never leaves the device.** MediaPipe runs entirely
  client-side (WASM + optional GPU delegate); no frame is ever uploaded
  anywhere.

## Performance

A `PerformanceMonitor` watches frame timing and steps the app between three
quality tiers (particle counts, bloom on/off, shadows on/off, DPR cap),
downgrading automatically under load rather than letting the experience
stutter.
