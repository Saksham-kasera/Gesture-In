import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

/* ---------------------------------------------------------------------- */
/* Particle field — additive glowing points drifting through the void     */
/* ---------------------------------------------------------------------- */

export const ParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color('#00f5ff'),
    uColorB: new THREE.Color('#8a2eff'),
    uPixelRatio: 1,
  },
  /* vertex */ `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute float aSize;
    attribute float aSeed;
    varying float vSeed;
    varying float vFade;
    void main() {
      vSeed = aSeed;
      vec3 pos = position;
      pos.y += sin(uTime * 0.15 + aSeed * 62.0) * 0.6;
      pos.x += cos(uTime * 0.1 + aSeed * 40.0) * 0.4;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      float dist = -mv.z;
      vFade = clamp(1.0 - dist / 26.0, 0.08, 1.0);
      gl_PointSize = aSize * uPixelRatio * (180.0 / dist);
    }
  `,
  /* fragment */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying float vSeed;
    varying float vFade;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      float alpha = smoothstep(0.5, 0.0, d);
      alpha = pow(alpha, 1.6);
      vec3 color = mix(uColorA, uColorB, fract(vSeed * 3.7));
      gl_FragColor = vec4(color, alpha * vFade * 0.9);
    }
  `
);

/* ---------------------------------------------------------------------- */
/* Digital grid floor — perspective grid with pulse + scanline sweep      */
/* ---------------------------------------------------------------------- */

export const GridMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#00f5ff'),
    uColor2: new THREE.Color('#8a2eff'),
  },
  /* vertex */ `
    varying vec2 vUv;
    varying float vDist;
    void main() {
      vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vDist = -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* fragment */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uColor2;
    varying vec2 vUv;
    varying float vDist;

    float gridLine(vec2 uv, float scale) {
      vec2 g = abs(fract(uv * scale - 0.5) - 0.5) / fwidth(uv * scale);
      return 1.0 - min(min(g.x, g.y), 1.0);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float radial = length(centered) * 2.0;

      float g1 = gridLine(vUv, 40.0);
      float g2 = gridLine(vUv, 8.0) * 1.6;

      float pulse = sin(uTime * 0.6 - radial * 6.0) * 0.5 + 0.5;
      vec3 color = mix(uColor, uColor2, radial);
      float fade = smoothstep(1.0, 0.05, radial);
      float distFade = smoothstep(40.0, 4.0, vDist);

      float intensity = (g1 * 0.35 + g2 * 0.5) * fade * (0.45 + pulse * 0.55);
      gl_FragColor = vec4(color * intensity * 1.4, intensity * distFade);
    }
  `
);

/* ---------------------------------------------------------------------- */
/* Energy ring — expanding shockwave / ambient pulse ring                 */
/* ---------------------------------------------------------------------- */

export const EnergyRingMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#35d4ff'),
    uProgress: 0,
    uOpacity: 1,
  },
  /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform vec3 uColor;
    uniform float uProgress;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float d = length(vUv - 0.5) * 2.0;
      float ring = smoothstep(0.0, 0.02, 0.5 - abs(d - 0.5)) ;
      float edge = 1.0 - smoothstep(0.0, 1.0, abs(d - (0.5)));
      gl_FragColor = vec4(uColor, edge * uOpacity);
    }
  `
);

extend({ ParticleMaterial, DigitalGridMaterial: GridMaterial, EnergyRingMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    particleMaterial: any;
    digitalGridMaterial: any;
    energyRingMaterial: any;
  }
}
