"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { ShaderMaterial, Vector2 } from "three";
import { useSomniaStore } from "@/store/useSomniaStore";

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

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
    permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
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
  g.y = a0.y * x12.x + h.y * x12.y;
  g.z = a0.z * x12.z + h.z * x12.w;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 0.0001), 1.0);

  vec2 toMouse = uv - uMouse;
  vec2 rotated = vec2(-toMouse.y, toMouse.x);
  float mouseDistance = length(toMouse * aspect);
  float influence = exp(-mouseDistance * 8.6);

  vec2 swirlField = uv + rotated * influence * 0.14;
  vec2 repelField = swirlField + normalize(toMouse + vec2(0.0001)) * influence * 0.05;

  float nA = fbm(repelField * vec2(3.0, 2.4) + vec2(uTime * 0.045, -uTime * 0.028));
  float nB = fbm(repelField * vec2(5.4, 4.1) - vec2(uTime * 0.022, uTime * 0.034));
  float fog = smoothstep(-0.55, 0.85, nA * 0.72 + nB * 0.38);

  vec3 black = vec3(0.005, 0.004, 0.02);
  vec3 purple = vec3(0.07, 0.028, 0.15);
  vec3 cyanMist = vec3(0.06, 0.22, 0.29);

  vec3 color = mix(black, purple, fog);
  color += cyanMist * pow(max(fog, 0.0), 2.1) * 0.34;

  float torchCore = exp(-mouseDistance * 12.0);
  float torchHalo = exp(-mouseDistance * 4.1);

  color += vec3(0.06, 0.24, 0.3) * torchCore * 0.95;
  color += vec3(0.04, 0.09, 0.16) * torchHalo * 0.42;

  float vignette = smoothstep(1.08, 0.16, length((uv - 0.5) * vec2(1.08, 1.24)));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
`;

export function FogPlane() {
  const materialRef = useRef<ShaderMaterial>(null);
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);
  const mouseTarget = useMemo(() => new Vector2(0.5, 0.5), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new Vector2(size.width, size.height) },
      uMouse: { value: new Vector2(0.5, 0.5) },
    }),
    [size.height, size.width]
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size.height, size.width, uniforms]);

  useFrame((_, delta) => {
    const material = materialRef.current;

    if (!material) {
      return;
    }

    const { mousePosition } = useSomniaStore.getState();
    const normalizedX = mousePosition.x * 0.5 + 0.5;
    const normalizedY = 1 - (mousePosition.y * 0.5 + 0.5);

    mouseTarget.set(normalizedX, normalizedY);
    material.uniforms.uTime.value += delta * 0.7;
    material.uniforms.uMouse.value.lerp(mouseTarget, 0.16);
  });

  return (
    <mesh
      position={[0, 0, -6]}
      scale={[viewport.width * 2.6, viewport.height * 2.6, 1]}
      frustumCulled={false}
      renderOrder={-100}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
