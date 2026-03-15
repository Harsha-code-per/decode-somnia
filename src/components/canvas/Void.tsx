"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { ShaderMaterial, Vector2, type IUniform } from "three";
import { useSomniaStore } from "@/store/useSomniaStore";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;

  uniform float uTime;
  uniform float uProgress;
  uniform float uAnxiety;
  uniform vec2 uResolution;

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
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / max(uResolution.y, 1.0);

    float progress = clamp(uProgress, 0.0, 1.0);
    float descent = smoothstep(0.22, 0.34, progress) * (1.0 - smoothstep(0.52, 0.68, progress));
    float anchor = smoothstep(0.5, 0.68, progress) * (1.0 - smoothstep(0.8, 0.94, progress));
    float release = smoothstep(0.75, 1.0, progress);

    float turbulence = max(descent, uAnxiety);
    float time = uTime * (0.004 + descent * 0.064 + anchor * 0.012);

    float broad = snoise(uv * 0.72 + vec2(time * 0.42, -time * 0.18));
    float medium = snoise(uv * 1.28 + vec2(-time * 0.3, time * 0.16));
    float detail = snoise(uv * 2.4 + vec2(time * 0.2, -time * 0.12));
    float flow = broad * 0.58 + medium * 0.3 + detail * 0.12;

    float stormMask = (0.2 + turbulence * 0.88) * descent * (1.0 - release);
    float calmMask = anchor * (1.0 - release * 0.7);

    vec3 blackBottom = vec3(0.003, 0.004, 0.01);
    vec3 blackTop = vec3(0.012, 0.012, 0.022);
    vec3 baseNight = mix(blackBottom, blackTop, smoothstep(-1.0, 1.0, uv.y + 0.16));

    vec3 stormA = vec3(0.06, 0.02, 0.11);
    vec3 stormB = vec3(0.18, 0.03, 0.24);
    vec3 stormColor = mix(stormA, stormB, smoothstep(-0.9, 1.1, flow + uv.y * 0.28));

    vec3 anchorA = vec3(0.025, 0.06, 0.12);
    vec3 anchorB = vec3(0.08, 0.16, 0.24);
    vec3 anchorColor = mix(anchorA, anchorB, smoothstep(-0.9, 1.0, flow * 0.45 - uv.y * 0.08));

    vec3 night = baseNight;
    night += stormColor * stormMask;
    night = mix(night, anchorColor, calmMask * 0.46);

    vec3 dawnTop = vec3(1.0, 0.985, 0.95);
    vec3 dawnBottom = vec3(0.95, 0.94, 0.92);
    float horizon = smoothstep(-0.88, 1.08, uv.y * 0.96 + 0.12);
    vec3 dawnGradient = mix(dawnBottom, dawnTop, horizon);

    vec3 color = mix(night, dawnGradient, release);

    float vignette = smoothstep(1.6, 0.22, length(uv));
    color *= mix(0.88, 1.03, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

type VoidUniforms = {
  [uniform: string]: IUniform;
  uTime: { value: number };
  uProgress: { value: number };
  uAnxiety: { value: number };
  uResolution: { value: Vector2 };
};

export function Void() {
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo<VoidUniforms>(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uAnxiety: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
    }),
    []
  );

  useFrame((_, delta) => {
    const material = materialRef.current;

    if (!material) {
      return;
    }

    const { anxietyLevel, scrollProgress } = useSomniaStore.getState();
    material.uniforms.uTime.value += delta;
    material.uniforms.uProgress.value = scrollProgress;
    material.uniforms.uAnxiety.value = anxietyLevel;
  });

  useEffect(() => {
    const material = materialRef.current;

    if (!material) {
      return;
    }

    material.uniforms.uResolution.value.set(size.width, size.height);
  }, [size.height, size.width]);

  return (
    <mesh position={[0, 0, -2]} frustumCulled={false}>
      <planeGeometry args={[viewport.width * 1.35, viewport.height * 1.35]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
