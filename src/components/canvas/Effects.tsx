"use client";

import { EffectComposer } from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { BloomEffect } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils } from "three";
import { useSomniaStore } from "@/store/useSomniaStore";

export function Effects() {
  const bloomRef = useRef<BloomEffect | null>(null);
  const bloomEffect = useMemo(
    () =>
      new BloomEffect({
        intensity: 1.6,
        luminanceThreshold: 0.08,
        luminanceSmoothing: 0.72,
        mipmapBlur: false,
      }),
    []
  );

  useEffect(() => {
    bloomRef.current = bloomEffect;

    return () => {
      bloomRef.current = null;
      bloomEffect.dispose();
    };
  }, [bloomEffect]);

  useFrame((_, delta) => {
    const bloom = bloomRef.current;

    if (!bloom) {
      return;
    }

    const { scrollProgress } = useSomniaStore.getState();

    const chaos =
      MathUtils.smoothstep(scrollProgress, 0.0, 0.25) *
      (1 - MathUtils.smoothstep(scrollProgress, 0.25, 0.6));
    const anchor =
      MathUtils.smoothstep(scrollProgress, 0.6, 0.78) *
      (1 - MathUtils.smoothstep(scrollProgress, 0.84, 0.9));
    const release = MathUtils.smoothstep(scrollProgress, 0.84, 1.0);

    const targetIntensity =
      0.95 +
      chaos * 0.65 +
      anchor * 1.2 +
      release * 2.0;

    bloom.intensity = MathUtils.damp(bloom.intensity, targetIntensity, 3.5, delta);
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <primitive object={bloomEffect} />
    </EffectComposer>
  );
}
