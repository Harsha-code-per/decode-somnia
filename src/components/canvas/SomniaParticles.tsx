"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  RawShaderMaterial,
  Vector2,
} from "three";
import { useSomniaStore } from "@/store/useSomniaStore";

const PARTICLE_COUNT = 260000;
const EYE_CENTER_X = 1.28;
const EYE_CENTER_Y = 0.12;
const LEFT_EYE_CENTER: [number, number, number] = [-EYE_CENTER_X, EYE_CENTER_Y, 0];
const RIGHT_EYE_CENTER: [number, number, number] = [EYE_CENTER_X, EYE_CENTER_Y, 0];
const EYE_INNER_RADIUS = 0.24;
const EYE_OUTER_RADIUS = 0.92;
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
uniform float uBreath;
uniform vec2 uMouse;
uniform vec2 uViewport;
uniform vec3 uCrimson;
uniform vec3 uViolet;
uniform vec3 uCyan;
uniform vec3 uWhite;

attribute vec3 position;
attribute vec3 aStateEyes;
attribute vec3 aStateChaos;
attribute vec3 aStateOrb;
attribute vec3 aStateDust;
attribute float aScale;
attribute float aSeed;
attribute float aEyeSide;

varying vec3 vColor;

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

vec3 simplexFlow(vec3 p, float time, float seed) {
  float fx = snoise(p * 0.62 + vec3(time * 0.24, seed * 2.1, seed * 0.5));
  float fy = snoise(p * 0.62 + vec3(seed * 1.7, time * 0.21, seed * 2.8));
  float fz = snoise(p * 0.62 + vec3(seed * 3.3, seed * 1.1, time * 0.18));
  return vec3(fx, fy, fz);
}

void main() {
  const float EYE_CENTER_X = 1.28;
  const float EYE_CENTER_Y = 0.12;
  const float EYE_OUTER_RADIUS = 0.92;

  float chaosPhase = smoothstep(0.22, 0.62, uProgress);
  float anchorPhase = smoothstep(0.58, 0.84, uProgress);
  float releasePhase = smoothstep(0.84, 1.0, uProgress);
  float eyePhase = 1.0 - smoothstep(0.12, 0.45, uProgress);

  vec3 eyes = aStateEyes;
  vec2 eyeCenter = vec2(aEyeSide * EYE_CENTER_X, EYE_CENTER_Y);
  vec2 localEye = eyes.xy - eyeCenter;
  float eyeRadius = length(localEye);
  float eyeAngle = atan(localEye.y, localEye.x);
  float eyeSpin = uTime * 0.22 + aSeed * 0.8 + eyeRadius * 1.9;
  mat2 eyeRotation = mat2(
    cos(eyeSpin), -sin(eyeSpin),
    sin(eyeSpin), cos(eyeSpin)
  );
  localEye = eyeRotation * localEye;
  eyes.xy = eyeCenter + localEye;
  eyes.z += sin(eyeAngle * 3.2 + uTime * 0.55 + aSeed * 12.0) * 0.11;

  vec3 chaos = aStateChaos;
  chaos += simplexFlow(aStateChaos, uTime * 0.9, aSeed) * (0.22 + chaosPhase * 1.05);

  vec3 orbPosition = normalize(
    aStateOrb + simplexFlow(aStateOrb * 0.9, uTime * 0.34, aSeed + 2.0) * 0.24 + vec3(0.0001)
  ) * (0.62 + aScale * 0.58 + uBreath * 0.18);
  float phase3Progress = smoothstep(0.56, 0.72, uProgress);

  vec3 dust = aStateDust;
  dust += simplexFlow(aStateDust * 0.72, uTime * 0.63, aSeed + 3.0) * (0.16 + releasePhase * 0.55);

  vec3 target = mix(eyes, chaos, chaosPhase);
  target = mix(target, orbPosition, phase3Progress);
  target = mix(target, dust, releasePhase);

  vec3 fluid = simplexFlow(target * 0.84, uTime * 1.05, aSeed + 5.0);
  target += fluid * (chaosPhase * 0.92 + releasePhase * 0.3);

  float aspect = uViewport.x / max(uViewport.y, 0.0001);
  vec2 mouseField = vec2(uMouse.x * aspect * 1.9, uMouse.y * 1.45);
  vec2 toMouse = target.xy - mouseField;
  float mouseDistance = length(toMouse);
  float repel = smoothstep(2.4, 0.0, mouseDistance);
  vec2 mouseDir = normalize(toMouse + vec2(0.0001));
  vec2 tangent = vec2(-mouseDir.y, mouseDir.x);
  target.xy += mouseDir * repel * (0.28 + chaosPhase * 0.32);
  target.xy += tangent * repel * (0.22 + eyePhase * 0.28 + chaosPhase * 0.44);
  target.z += repel * (0.14 + chaosPhase * 0.2);

  vec4 mvCenter = modelViewMatrix * vec4(target + position, 1.0);
  float perspective = clamp(2.7 / max(-mvCenter.z, 1.0), 0.82, 1.2);
  float microSize = mix(2.0, 2.9, aScale);
  gl_PointSize = clamp(microSize * perspective, 2.0, 3.0);
  gl_Position = projectionMatrix * mvCenter;

  float phase12Tint = 0.5 + 0.5 * sin(uTime * 0.32 + aSeed * 12.0 + eyeRadius * 3.0);
  vec3 phase12Color = mix(uCrimson, uViolet, phase12Tint * 0.45 + chaosPhase * 0.22);

  float phase34Tint = 0.5 + 0.5 * sin(uTime * 0.24 + aSeed * 8.0 + target.z * 0.5);
  vec3 phase34Color = mix(uCyan, uWhite, phase34Tint * 0.62 + releasePhase * 0.3);

  float phaseBlend = smoothstep(0.58, 0.84, uProgress);
  vColor = mix(phase12Color, phase34Color, phaseBlend);

  float brightness = 0.88 + chaosPhase * 0.34 + anchorPhase * 0.38 + releasePhase * 0.46;
  float eyeEdge = smoothstep(0.2, EYE_OUTER_RADIUS, eyeRadius);
  vColor *= brightness * mix(1.2, 0.85, eyeEdge * eyePhase);
}
`;

const fragmentShader = `
precision highp float;
precision highp int;

varying vec3 vColor;

void main() {
  vec2 xy = gl_PointCoord.xy - vec2(0.5);
  float ll = length(xy);
  if(ll > 0.5) discard;
  float alphaFalloff = pow(1.0 - (ll * 2.0), 2.0); // Smooth falloff
  gl_FragColor = vec4(vColor, 0.4 * alphaFalloff);
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

const createEyeVortexPoint = (eyeCenter: [number, number, number], seed: number) => {
  const angle = hashFloat(seed) * Math.PI * 2;
  const radialMix = Math.pow(hashFloat(seed + 1), 0.24);
  const radius = EYE_INNER_RADIUS + radialMix * (EYE_OUTER_RADIUS - EYE_INNER_RADIUS);
  const swirlOffset = (hashFloat(seed + 2) - 0.5) * 0.35;
  const theta = angle + swirlOffset;
  const x = Math.cos(theta) * radius * 1.08;
  const y = Math.sin(theta) * radius * 0.56;
  const z =
    (hashFloat(seed + 3) - 0.5) * 0.28 +
    Math.sin(theta * 2.4 + seed * 0.08) * 0.08;

  return [
    eyeCenter[0] + x,
    eyeCenter[1] + y,
    eyeCenter[2] + z,
  ] as const;
};

const breatheValueAt = (elapsedTime: number) => {
  const phase = elapsedTime % BREATH_CYCLE_SECONDS;

  if (phase <= BREATH_IN_SECONDS) {
    return phase / BREATH_IN_SECONDS;
  }

  return 1 - (phase - BREATH_IN_SECONDS) / BREATH_OUT_SECONDS;
};

export function SomniaParticles() {
  const materialRef = useRef<RawShaderMaterial>(null);
  const viewport = useThree((state) => state.viewport);
  const mouseTarget = useMemo(() => new Vector2(), []);

  const geometry = useMemo(() => {
    const pointGeometry = new BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const stateEyes = new Float32Array(PARTICLE_COUNT * 3);
    const stateChaos = new Float32Array(PARTICLE_COUNT * 3);
    const stateOrb = new Float32Array(PARTICLE_COUNT * 3);
    const stateDust = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);
    const seeds = new Float32Array(PARTICLE_COUNT);
    const eyeSides = new Float32Array(PARTICLE_COUNT);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const offset = index * 3;
      const seed = index * 11.731;
      const eyeSide = index % 2 === 0 ? -1 : 1;
      const eyeCenter: [number, number, number] =
        eyeSide < 0 ? LEFT_EYE_CENTER : RIGHT_EYE_CENTER;
      const eyePoint = createEyeVortexPoint(eyeCenter, seed + 1);
      const chaosPoint = randomInVolume([12.5, 8.0, 9.2], seed + 11);
      const orbPoint = randomInSphere(1.35, [0, 0, 0], seed + 21);
      const dustPoint = randomInVolume([16.5, 10.8, 12.2], seed + 31);

      positions[offset] = 0;
      positions[offset + 1] = 0;
      positions[offset + 2] = 0;

      stateEyes[offset] = eyePoint[0];
      stateEyes[offset + 1] = eyePoint[1];
      stateEyes[offset + 2] = eyePoint[2];

      stateChaos[offset] = chaosPoint[0];
      stateChaos[offset + 1] = chaosPoint[1];
      stateChaos[offset + 2] = chaosPoint[2];

      stateOrb[offset] = orbPoint[0];
      stateOrb[offset + 1] = orbPoint[1];
      stateOrb[offset + 2] = orbPoint[2];

      stateDust[offset] = dustPoint[0];
      stateDust[offset + 1] = dustPoint[1];
      stateDust[offset + 2] = dustPoint[2];

      scales[index] = hashFloat(seed + 41);
      seeds[index] = hashFloat(seed + 51);
      eyeSides[index] = eyeSide;
    }

    pointGeometry.setAttribute("position", new BufferAttribute(positions, 3));
    pointGeometry.setAttribute("aStateEyes", new BufferAttribute(stateEyes, 3));
    pointGeometry.setAttribute("aStateChaos", new BufferAttribute(stateChaos, 3));
    pointGeometry.setAttribute("aStateOrb", new BufferAttribute(stateOrb, 3));
    pointGeometry.setAttribute("aStateDust", new BufferAttribute(stateDust, 3));
    pointGeometry.setAttribute("aScale", new BufferAttribute(scales, 1));
    pointGeometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    pointGeometry.setAttribute("aEyeSide", new BufferAttribute(eyeSides, 1));
    pointGeometry.computeBoundingSphere();

    return pointGeometry;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uBreath: { value: 0 },
      uMouse: { value: new Vector2() },
      uViewport: { value: new Vector2(viewport.width, viewport.height) },
      uCrimson: { value: new Color("#cc0000") },
      uViolet: { value: new Color("#4a00e0") },
      uCyan: { value: new Color("#00f0ff") },
      uWhite: { value: new Color("#ffffff") },
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

    const { scrollProgress, mousePosition } = useSomniaStore.getState();

    mouseTarget.set(mousePosition.x, mousePosition.y);

    material.uniforms.uTime.value += delta * 0.55;
    material.uniforms.uProgress.value = scrollProgress;
    material.uniforms.uBreath.value = breatheValueAt(state.clock.elapsedTime);
    material.uniforms.uMouse.value.lerp(mouseTarget, 0.2);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <rawShaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
