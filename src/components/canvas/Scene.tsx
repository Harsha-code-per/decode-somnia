"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
} from "@react-three/postprocessing";
import { Suspense } from "react";
import { Color } from "three";
import { SomniaParticles } from "./SomniaParticles";
import { useSomniaStore } from "@/store/useSomniaStore";

function SceneContent() {
  return (
    <>
      <SomniaParticles />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom luminanceThreshold={0.0} mipmapBlur={true} intensity={2.0} />
      </EffectComposer>
    </>
  );
}

export function Scene() {
  const experienceUnlocked = useSomniaStore((state) => state.experienceUnlocked);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[-1] transition-opacity duration-700 ${
        experienceUnlocked ? "opacity-100" : "opacity-0"
      }`}
    >
      <Canvas
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0, 4], fov: 42, near: 0.1, far: 30 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ scene }) => {
          scene.background = new Color("#000000");
        }}
      >
        <AdaptiveDpr />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
