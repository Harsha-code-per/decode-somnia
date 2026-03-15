"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import {
  AdditiveBlending,
  Group,
  MathUtils,
  ShaderMaterial,
  type IUniform,
} from "three";
import { useSomniaStore } from "@/store/useSomniaStore";

const eyeVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const eyeFragmentShader = `
  varying vec2 vUv;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;

  void main() {
    vec2 uv = vUv - 0.5;
    vec2 almondUv = vec2(uv.x * 1.15, uv.y * 2.7);
    float almond = 1.0 - smoothstep(0.18, 0.54, length(almondUv));
    float lids = smoothstep(0.34, 0.04, abs(uv.y * 2.4));
    float slit = 1.0 - smoothstep(0.0, 0.18, length(vec2(uv.x * 1.7, uv.y * 5.6)));
    float pulse = 0.9 + 0.1 * sin(uTime * 1.2 + uSeed * 6.28318);

    vec3 deepRed = vec3(0.15, 0.0, 0.02);
    vec3 hotRed = vec3(1.0, 0.12, 0.18);
    vec3 ember = vec3(1.0, 0.36, 0.22);
    vec3 color = mix(deepRed, hotRed, almond * 0.85 + slit * 0.15);
    color = mix(color, ember, slit * 0.42);

    float alpha = (almond * 0.75 + lids * 0.2 + slit * 0.9) * uOpacity * pulse;
    alpha *= smoothstep(0.86, 0.12, abs(uv.x * 1.08));

    if (alpha < 0.002) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

interface EyeProps {
  billboardRef: RefObject<Group | null>;
  materialRef: RefObject<ShaderMaterial | null>;
  position: [number, number, number];
  seed: number;
}

function Eye({ billboardRef, materialRef, position, seed }: EyeProps) {
  const uniforms = useMemo<{ [uniform: string]: IUniform }>(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uSeed: { value: seed },
    }),
    [seed]
  );

  return (
    <Billboard ref={billboardRef} position={position}>
      <mesh>
        <planeGeometry args={[1.12, 0.52]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={eyeVertexShader}
          fragmentShader={eyeFragmentShader}
          transparent
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
}

export function Eyes() {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const leftMaterialRef = useRef<ShaderMaterial>(null);
  const rightMaterialRef = useRef<ShaderMaterial>(null);

  useFrame((state, delta) => {
    const { mousePosition, scrollProgress } = useSomniaStore.getState();
    const reveal = MathUtils.smoothstep(scrollProgress, 0.015, 0.08);
    const dissolve = MathUtils.smoothstep(scrollProgress, 0.24, 0.36);
    const opacity = reveal * (1 - dissolve);
    const trackX = mousePosition.x * 0.07;
    const trackY = -mousePosition.y * 0.04;

    if (leftRef.current) {
      leftRef.current.position.x = MathUtils.damp(
        leftRef.current.position.x,
        -0.72 + trackX,
        3.6,
        delta
      );
      leftRef.current.position.y = MathUtils.damp(
        leftRef.current.position.y,
        0.08 + trackY,
        3.6,
        delta
      );
    }

    if (rightRef.current) {
      rightRef.current.position.x = MathUtils.damp(
        rightRef.current.position.x,
        0.72 + trackX,
        3.6,
        delta
      );
      rightRef.current.position.y = MathUtils.damp(
        rightRef.current.position.y,
        0.08 + trackY,
        3.6,
        delta
      );
    }

    const applyUniforms = (material: ShaderMaterial | null) => {
      if (!material) {
        return;
      }

      material.uniforms.uTime.value += delta;
      material.uniforms.uOpacity.value = opacity;
    };

    applyUniforms(leftMaterialRef.current);
    applyUniforms(rightMaterialRef.current);
  });

  return (
    <>
      <Eye
        billboardRef={leftRef}
        materialRef={leftMaterialRef}
        position={[-0.72, 0.08, 1.05]}
        seed={0.12}
      />
      <Eye
        billboardRef={rightRef}
        materialRef={rightMaterialRef}
        position={[0.72, 0.08, 1.05]}
        seed={0.68}
      />
    </>
  );
}
