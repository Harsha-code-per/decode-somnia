"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  InstancedBufferAttribute,
  InstancedMesh,
  PlaneGeometry,
  RawShaderMaterial,
  Vector2,
} from "three";
import { useSomniaStore } from "@/store/useSomniaStore";

const PARTICLE_COUNT = 100000;
const BREATH_IN_SECONDS = 4;
const BREATH_OUT_SECONDS = 6;
const BREATH_CYCLE_SECONDS = BREATH_IN_SECONDS + BREATH_OUT_SECONDS;

const vertexShader = `
precision highp float;
precision highp int;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uProgress;
uniform float uRelease;
uniform float uThoughtSpread;
uniform vec2 uMouse;
uniform vec2 uViewport;
uniform float uBreath;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 aStateIntro;
attribute vec3 aStateA;
attribute vec3 aStateB;
attribute vec3 aStateC;
attribute float aScale;
attribute float aSeed;

varying vec2 vUv;
varying float vTwinkle;
varying float vChaos;
varying float vAnchor;
varying float vRelease;
varying float vAlphaNoise;
varying float vIntro;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(
    permute(
      permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0)
    )
    + i.x + vec4(0.0, i1.x, i2.x, 1.0)
  );

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(
    dot(p0, p0),
    dot(p1, p1),
    dot(p2, p2),
    dot(p3, p3)
  ));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(
    dot(x0, x0),
    dot(x1, x1),
    dot(x2, x2),
    dot(x3, x3)
  ), 0.0);
  m = m * m;

  return 42.0 * dot(
    m * m,
    vec4(
      dot(p0, x0),
      dot(p1, x1),
      dot(p2, x2),
      dot(p3, x3)
    )
  );
}

vec3 curlNoise(vec3 p) {
  float e = 0.1;
  float nx1 = snoise(vec3(p.x, p.y + e, p.z));
  float nx2 = snoise(vec3(p.x, p.y - e, p.z));
  float ny1 = snoise(vec3(p.x, p.y, p.z + e));
  float ny2 = snoise(vec3(p.x, p.y, p.z - e));
  float nz1 = snoise(vec3(p.x + e, p.y, p.z));
  float nz2 = snoise(vec3(p.x - e, p.y, p.z));

  float x = ny1 - ny2 - (nx1 - nx2);
  float y = nz1 - nz2 - (ny1 - ny2);
  float z = nx1 - nx2 - (nz1 - nz2);

  return normalize(vec3(x, y, z) + 0.00001);
}

void main() {
  vUv = uv;

  float chaosMix = smoothstep(0.18, 0.42, uProgress);
  float chaosHold = 1.0 - smoothstep(0.58, 0.82, uProgress);
  float chaosPhase = chaosMix * chaosHold;
  float anchorPhase = smoothstep(0.58, 0.82, uProgress);
  float releasePhase = smoothstep(0.8, 1.0, uProgress);
  float introPhase = smoothstep(0.18, 0.96, uRelease);

  vec3 eyes = aStateA;
  vec3 chaos = aStateB + curlNoise(aStateB * 0.42 + vec3(uTime * 0.14 + aSeed * 3.1)) * (0.92 * chaosPhase);
  vec3 orb = aStateC * (1.0 + uBreath * 0.14) * (1.0 + releasePhase * 4.8);

  vec3 target = mix(eyes, chaos, chaosMix);
  target = mix(target, orb, anchorPhase);

  vec3 intro = vec3(
    aStateIntro.x * uThoughtSpread,
    aStateIntro.y * (0.62 + uThoughtSpread * 0.06),
    aStateIntro.z * 0.38
  );
  float burstWave = sin(clamp(uRelease, 0.0, 1.0) * 3.14159265);
  vec3 burstDirection = normalize(
    aStateB + vec3(aSeed - 0.5, sin(aSeed * 6.2831853), cos(aSeed * 12.5663706))
  );
  vec3 introTarget = intro + burstDirection * burstWave * 2.05;
  target = mix(introTarget, target, introPhase);

  vec3 mouseField = vec3(uMouse.x * uViewport.x * 0.5, uMouse.y * uViewport.y * 0.5, 0.0);
  vec3 repulseVector = target - mouseField;
  float repulseDistance = length(repulseVector);
  float repulseStrength = smoothstep(1.65, 0.0, repulseDistance) * (0.45 + chaosPhase * 0.85 + anchorPhase * 0.32);
  target += normalize(repulseVector + vec3(0.0001)) * repulseStrength;
  target.z += repulseStrength * (0.36 + chaosPhase * 0.58);

  float opacityNoise = 0.22 + 0.78 * smoothstep(
    -0.35,
    0.72,
    snoise(target * 2.65 + vec3(aSeed * 6.0, uTime * 0.05, aSeed * 2.2))
  );
  float size = aScale * (0.82 + opacityNoise * 0.58 + anchorPhase * 0.08 + releasePhase * 0.24);
  vec4 mvCenter = modelViewMatrix * vec4(target, 1.0);
  mvCenter.xy += position.xy * size;

  gl_Position = projectionMatrix * mvCenter;

  vTwinkle = 0.78 + 0.22 * sin(uTime * 0.9 + aSeed * 18.0);
  vChaos = chaosPhase;
  vAnchor = anchorPhase;
  vRelease = releasePhase;
  vAlphaNoise = opacityNoise;
  vIntro = 1.0 - introPhase;
}
`;

const fragmentShader = `
precision highp float;
precision highp int;

varying vec2 vUv;
varying float vTwinkle;
varying float vChaos;
varying float vAnchor;
varying float vRelease;
varying float vAlphaNoise;
varying float vIntro;

void main() {
  vec2 centeredUv = vUv - 0.5;
  float dist = length(centeredUv);
  float haze = pow(smoothstep(0.54, 0.0, dist), 1.35);
  float soft = pow(smoothstep(0.34, 0.0, dist), 1.8);
  float core = pow(smoothstep(0.14, 0.0, dist), 2.4);

  vec3 introColor = mix(vec3(0.18, 0.04, 0.24), vec3(0.86, 0.16, 0.64), soft);
  vec3 eyeColor = mix(vec3(0.18, 0.01, 0.08), vec3(1.0, 0.04, 0.2), core);
  vec3 chaosColor = mix(vec3(0.18, 0.02, 0.22), vec3(0.62, 0.12, 0.58), soft);
  vec3 anchorColor = mix(vec3(0.03, 0.17, 0.42), vec3(0.0, 0.94, 1.0), core);
  vec3 releaseColor = vec3(1.0, 0.98, 0.94);

  vec3 color = eyeColor;
  color = mix(color, introColor, clamp(vIntro, 0.0, 1.0));
  color = mix(color, chaosColor, clamp(vChaos * 1.1, 0.0, 1.0));
  color = mix(color, anchorColor, clamp(vAnchor, 0.0, 1.0));
  color = mix(color, releaseColor, clamp(vRelease, 0.0, 1.0));

  float alpha = haze * (0.012 + soft * 0.09 + core * 0.42) * vTwinkle * vAlphaNoise;
  alpha += vIntro * haze * 0.05;
  alpha += vRelease * haze * 0.1;

  if (alpha < 0.004) {
    discard;
  }

  gl_FragColor = vec4(color, alpha);
}
`;

const hashFloat = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;

  return x - Math.floor(x);
};

const randomInSphere = (radius: number, target: [number, number, number], seed: number) => {
  const theta = hashFloat(seed) * Math.PI * 2;
  const phi = Math.acos(hashFloat(seed + 1) * 2 - 1);
  const distance = Math.cbrt(hashFloat(seed + 2)) * radius;
  const sinPhi = Math.sin(phi);
  const x = Math.cos(theta) * sinPhi;
  const y = Math.sin(theta) * sinPhi;
  const z = Math.cos(phi);

  return [
    target[0] + x * distance,
    target[1] + y * distance,
    target[2] + z * distance,
  ] as const;
};

const randomInVolume = (size: [number, number, number], seed: number) =>
  [
    (hashFloat(seed) - 0.5) * size[0],
    (hashFloat(seed + 1) - 0.5) * size[1],
    (hashFloat(seed + 2) - 0.5) * size[2],
  ] as const;

const breatheValueAt = (elapsedTime: number) => {
  const phase = elapsedTime % BREATH_CYCLE_SECONDS;

  if (phase <= BREATH_IN_SECONDS) {
    return phase / BREATH_IN_SECONDS;
  }

  return 1 - (phase - BREATH_IN_SECONDS) / BREATH_OUT_SECONDS;
};

export function ParticleSwarm() {
  const meshRef = useRef<InstancedMesh>(null);
  const materialRef = useRef<RawShaderMaterial>(null);
  const viewport = useThree((state) => state.viewport);
  const mouseTarget = useMemo(() => new Vector2(), []);

  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(1, 1, 1, 1);
    const stateIntro = new Float32Array(PARTICLE_COUNT * 3);
    const stateA = new Float32Array(PARTICLE_COUNT * 3);
    const stateB = new Float32Array(PARTICLE_COUNT * 3);
    const stateC = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);
    const seeds = new Float32Array(PARTICLE_COUNT);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const stateAOffset = index * 3;
      const eyeCenter: [number, number, number] =
        index % 2 === 0 ? [-0.82, 0.12, 0] : [0.82, 0.12, 0];
      const seed = index * 11.731;
      const introPoint = randomInVolume([1.05, 0.28, 0.24], seed + 0.5);
      const eyePoint = randomInSphere(0.44, eyeCenter, seed + 1);
      const chaosPoint = randomInVolume([9.8, 6.2, 7.4], seed + 11);
      const orbPoint = randomInSphere(0.92, [0, 0, 0], seed + 21);

      stateIntro[stateAOffset] = introPoint[0];
      stateIntro[stateAOffset + 1] = introPoint[1];
      stateIntro[stateAOffset + 2] = introPoint[2];

      stateA[stateAOffset] = eyePoint[0];
      stateA[stateAOffset + 1] = eyePoint[1];
      stateA[stateAOffset + 2] = eyePoint[2];

      stateB[stateAOffset] = chaosPoint[0];
      stateB[stateAOffset + 1] = chaosPoint[1];
      stateB[stateAOffset + 2] = chaosPoint[2];

      stateC[stateAOffset] = orbPoint[0];
      stateC[stateAOffset + 1] = orbPoint[1];
      stateC[stateAOffset + 2] = orbPoint[2];

      scales[index] = 0.0048 + hashFloat(seed + 31) * 0.0105;
      seeds[index] = hashFloat(seed + 41);
    }

    plane.setAttribute("aStateIntro", new InstancedBufferAttribute(stateIntro, 3));
    plane.setAttribute("aStateA", new InstancedBufferAttribute(stateA, 3));
    plane.setAttribute("aStateB", new InstancedBufferAttribute(stateB, 3));
    plane.setAttribute("aStateC", new InstancedBufferAttribute(stateC, 3));
    plane.setAttribute("aScale", new InstancedBufferAttribute(scales, 1));
    plane.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 1));

    return plane;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uRelease: { value: 0 },
      uThoughtSpread: { value: 0.78 },
      uMouse: { value: new Vector2() },
      uViewport: { value: new Vector2(viewport.width, viewport.height) },
      uBreath: { value: 0 },
    }),
    [viewport.height, viewport.width]
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    uniforms.uViewport.value.set(viewport.width, viewport.height);
  }, [uniforms, viewport.height, viewport.width]);

  useFrame((state, delta) => {
    const material = materialRef.current;

    if (!material) {
      return;
    }

    const { scrollProgress, mousePosition, releaseProgress, thought } = useSomniaStore.getState();
    const breath = breatheValueAt(state.clock.elapsedTime);
    const thoughtSpread = 0.72 + Math.min(1.5, thought.length * 0.012);

    mouseTarget.set(mousePosition.x, mousePosition.y);

    material.uniforms.uTime.value += delta * 0.55;
    material.uniforms.uProgress.value = scrollProgress;
    material.uniforms.uRelease.value = releaseProgress;
    material.uniforms.uThoughtSpread.value +=
      (thoughtSpread - material.uniforms.uThoughtSpread.value) * 0.08;
    material.uniforms.uBreath.value = breath;
    material.uniforms.uViewport.value.set(viewport.width, viewport.height);
    material.uniforms.uMouse.value.lerp(mouseTarget, 0.18);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
    >
      <rawShaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </instancedMesh>
  );
}
