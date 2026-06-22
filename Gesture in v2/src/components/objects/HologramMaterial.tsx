import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

export const HologramMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#00f5ff'),
    uOpacity: 0.85,
    uFresnelPower: 2.2,
    uScanSpeed: 1.4,
    uFlicker: 1.0,
    uHighlight: 0.0,
  },
  /* vertex */ `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPos;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mv.xyz);
      vPos = position;
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* fragment */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uFresnelPower;
    uniform float uScanSpeed;
    uniform float uFlicker;
    uniform float uHighlight;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPos;

    void main() {
      float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), uFresnelPower);

      float scan = sin((vPos.y * 6.0) - uTime * uScanSpeed * 4.0) * 0.5 + 0.5;
      scan = pow(scan, 3.0) * 0.5;

      float flicker = (0.92 + 0.08 * sin(uTime * 30.0)) * uFlicker;

      vec3 color = uColor * (0.55 + fresnel * 1.6) + uColor * scan * 0.4 + vec3(uHighlight);
      float alpha = clamp((0.25 + fresnel * 0.85 + scan * 0.3) * uOpacity * flicker, 0.0, 1.0);

      gl_FragColor = vec4(color, alpha);
    }
  `
);

extend({ HologramMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    hologramMaterial: any;
  }
}
