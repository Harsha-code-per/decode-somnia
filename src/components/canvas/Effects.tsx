"use client";

import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
} from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import {
  BlendFunction,
  BloomEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
} from "postprocessing";
import { useRef } from "react";
import { MathUtils, Vector2 } from "three";
import { useSomniaStore } from "@/store/useSomniaStore";

const INITIAL_CHROMATIC_OFFSET = new Vector2(0.0001, -0.00008);

export function Effects() {
  const bloomRef = useRef<BloomEffect | null>(null);
  const noiseRef = useRef<NoiseEffect | null>(null);
  const chromaticRef = useRef<ChromaticAberrationEffect | null>(null);

  useFrame((_, delta) => {
    const bloom = bloomRef.current;
    const noise = noiseRef.current;
    const chromatic = chromaticRef.current;

    if (!bloom || !noise || !chromatic) {
      return;
    }

    const { anxietyLevel, scrollProgress } = useSomniaStore.getState();
    const chaos = 1 - MathUtils.smoothstep(scrollProgress, 0.24, 0.56);
    const shape =
      MathUtils.smoothstep(scrollProgress, 0.34, 0.56) *
      (1 - MathUtils.smoothstep(scrollProgress, 0.64, 0.82));
    const anchor =
      MathUtils.smoothstep(scrollProgress, 0.62, 0.82) *
      (1 - MathUtils.smoothstep(scrollProgress, 0.9, 1));
    const release = MathUtils.smoothstep(scrollProgress, 0.82, 1);

    bloom.intensity = MathUtils.damp(
      bloom.intensity,
      0.9 + chaos * 0.9 + anchor * 1.6 + release * 1.2,
      3,
      delta
    );

    noise.blendMode.opacity.value = MathUtils.damp(
      noise.blendMode.opacity.value,
      0.004 + chaos * 0.07 + shape * 0.025,
      4,
      delta
    );

    const targetOffset = 0.00004 + chaos * 0.0026 + anxietyLevel * 0.00035;
    chromatic.offset.x = MathUtils.damp(chromatic.offset.x, targetOffset, 5, delta);
    chromatic.offset.y = MathUtils.damp(chromatic.offset.y, -targetOffset * 0.82, 5, delta);
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField
        focusDistance={0}
        focalLength={0.02}
        bokehScale={2}
        height={480}
      />
      <Bloom
        ref={bloomRef}
        intensity={2}
        luminanceThreshold={0.025}
        luminanceSmoothing={0.62}
        mipmapBlur
      />
      <Noise ref={noiseRef} blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.012} />
      <ChromaticAberration
        ref={chromaticRef}
        offset={INITIAL_CHROMATIC_OFFSET}
        blendFunction={BlendFunction.NORMAL}
        radialModulation
        modulationOffset={0.2}
      />
    </EffectComposer>
  );
}
