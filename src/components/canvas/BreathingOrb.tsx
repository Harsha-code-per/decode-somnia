"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  MathUtils,
  Mesh,
  ShaderMaterial,
  type IUniform,
} from "three";
import { useSomniaStore } from "@/store/useSomniaStore";

const BREATH_IN_SECONDS = 4;
const BREATH_OUT_SECONDS = 6;
const BREATH_CYCLE_SECONDS = BREATH_IN_SECONDS + BREATH_OUT_SECONDS;

const vertexShader = `
  varying vec2 vUv;

  uniform float uTime;
  uniform float uBreath;
  uniform float uRelease;

  void main() {
    vUv = uv;

    vec3 transformed = position;
    vec2 centeredUv = uv - 0.5;
    float radius = length(centeredUv);
    float rim = 1.0 - smoothstep(0.0, 0.72, radius);
    float wave = sin((uv.x * 8.0 + uv.y * 7.0) + uTime * 0.42);

    transformed.z += wave * rim * (0.04 + uBreath * 0.028 + uRelease * 0.02);
    transformed.xy *= 1.0 + rim * (0.025 + uBreath * 0.03 + uRelease * 0.04);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;

  uniform float uTime;
  uniform float uBreath;
  uniform float uOpacity;
  uniform float uRelease;

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,
      0.366025403784439,
      -0.577350269189626,
      0.024390243902439
    );

    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0)) +
      i.x + vec3(0.0, i1.x, 1.0)
    );

    vec3 m = max(
      0.5 - vec3(
        dot(x0, x0),
        dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)
      ),
      0.0
    );
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;

    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 centeredUv = vUv - 0.5;
    float radius = length(centeredUv);
    float time = uTime * 0.08;

    float primaryNoise = snoise(centeredUv * 4.0 + vec2(time, -time * 0.7));
    float secondaryNoise = snoise(centeredUv * 7.2 + vec2(-time * 0.5, time * 0.32));
    float swirl = primaryNoise * 0.7 + secondaryNoise * 0.3;

    float rim = 1.0 - smoothstep(0.16, 0.78, radius + swirl * 0.05);
    float core = 1.0 - smoothstep(0.0, 0.22, radius - swirl * 0.035);
    float halo = 1.0 - smoothstep(0.18, 0.92, radius);

    vec3 abyssBlue = vec3(0.02, 0.08, 0.16);
    vec3 bioluminescentBlue = vec3(0.44, 0.78, 0.98);
    vec3 pearl = vec3(0.92, 0.97, 1.0);
    vec3 warmWhite = vec3(1.0, 0.97, 0.92);

    vec3 color = mix(abyssBlue, bioluminescentBlue, halo);
    color = mix(color, pearl, core * (0.46 + uBreath * 0.08));
    color += bioluminescentBlue * halo * (0.22 + uBreath * 0.08);
    color = mix(color, warmWhite, uRelease * (0.72 + core * 0.28));

    float alpha = (rim * 0.78 + halo * 0.2) * uOpacity;
    alpha *= smoothstep(1.0, 0.06, radius);
    alpha += halo * uRelease * 0.08;

    if (alpha < 0.002) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

type OrbUniforms = {
  [uniform: string]: IUniform;
  uTime: { value: number };
  uBreath: { value: number };
  uOpacity: { value: number };
  uRelease: { value: number };
};

const breatheValueAt = (elapsedTime: number) => {
  const phase = elapsedTime % BREATH_CYCLE_SECONDS;

  if (phase <= BREATH_IN_SECONDS) {
    return MathUtils.smootherstep(phase / BREATH_IN_SECONDS, 0, 1);
  }

  return 1 - MathUtils.smootherstep((phase - BREATH_IN_SECONDS) / BREATH_OUT_SECONDS, 0, 1);
};

export function BreathingOrb() {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo<OrbUniforms>(
    () => ({
      uTime: { value: 0 },
      uBreath: { value: 0 },
      uOpacity: { value: 0 },
      uRelease: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;

    if (!mesh || !material) {
      return;
    }

    const { scrollProgress } = useSomniaStore.getState();
    const breath = breatheValueAt(state.clock.elapsedTime);
    const reveal = MathUtils.smoothstep(scrollProgress, 0.48, 0.58);
    const release = MathUtils.smoothstep(scrollProgress, 0.76, 1);
    const pulseScale = 0.82 + breath * 0.24;
    const targetScale = Math.max(0.001, reveal * pulseScale * (1 + release * 8.6));
    const targetOpacity = reveal * (0.58 + release * 0.36);

    mesh.scale.x = MathUtils.damp(mesh.scale.x, targetScale, 2.7, delta);
    mesh.scale.y = MathUtils.damp(mesh.scale.y, targetScale, 2.7, delta);
    mesh.scale.z = 1;
    mesh.position.z = MathUtils.damp(mesh.position.z, 0.82 + release * 0.32, 2.4, delta);

    material.uniforms.uTime.value += delta;
    material.uniforms.uBreath.value = breath;
    material.uniforms.uRelease.value = release;
    material.uniforms.uOpacity.value = MathUtils.damp(
      material.uniforms.uOpacity.value,
      targetOpacity,
      2.5,
      delta
    );
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0.82]}>
      <planeGeometry args={[2.8, 2.8, 72, 72]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
