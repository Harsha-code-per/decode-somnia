"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Effects } from "./Effects";
import { ParticleSwarm } from "./ParticleSwarm";

function SceneContent() {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <ParticleSwarm />
      <Effects />
    </>
  );
}

export function Scene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1]">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 4], fov: 42, near: 0.1, far: 30 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      >
        <AdaptiveDpr />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
