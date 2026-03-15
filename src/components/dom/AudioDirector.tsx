"use client";

import { Howl, Howler } from "howler";
import { useEffect, useRef } from "react";
import { useSomniaStore } from "@/store/useSomniaStore";

const STATIC_FILE = "/audio/whispers.wav";
const PAD_FILE = "/audio/calm-chord.wav";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const clamped = clamp01(value);

  return clamped * clamped * (3 - 2 * clamped);
};

interface DroneNodes {
  gain: GainNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoDepth: GainNode;
  left: OscillatorNode;
  right: OscillatorNode;
}

export function AudioDirector() {
  const staticRef = useRef<Howl | null>(null);
  const padRef = useRef<Howl | null>(null);
  const droneRef = useRef<DroneNodes | null>(null);
  const unlockedRef = useRef(false);
  const smoothedStaticVolumeRef = useRef(0);
  const smoothedPadVolumeRef = useRef(0);

  useEffect(() => {
    Howler.autoUnlock = true;

    const staticBed = new Howl({
      src: [STATIC_FILE],
      loop: true,
      volume: 0,
      preload: true,
      html5: false,
      onloaderror: (_id, error) => {
        console.error("Failed to load static bed:", error);
      },
    });

    const ambientPad = new Howl({
      src: [PAD_FILE],
      loop: true,
      volume: 0,
      preload: true,
      html5: false,
      onloaderror: (_id, error) => {
        console.error("Failed to load ambient pad:", error);
      },
    });

    staticRef.current = staticBed;
    padRef.current = ambientPad;

    const createDrone = () => {
      if (droneRef.current) {
        return droneRef.current;
      }

      const context = Howler.ctx;

      if (!context) {
        return null;
      }

      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      const lfo = context.createOscillator();
      const lfoDepth = context.createGain();
      const left = context.createOscillator();
      const right = context.createOscillator();
      const leftPan = context.createStereoPanner();
      const rightPan = context.createStereoPanner();

      gain.gain.value = 0;
      filter.type = "lowpass";
      filter.frequency.value = 720;
      filter.Q.value = 0.9;

      left.type = "sine";
      right.type = "sine";
      left.frequency.value = 432;
      right.frequency.value = 434.5;

      leftPan.pan.value = -0.28;
      rightPan.pan.value = 0.28;

      lfo.type = "sine";
      lfo.frequency.value = 0.065;
      lfoDepth.gain.value = 22;

      lfo.connect(lfoDepth);
      lfoDepth.connect(filter.frequency);
      left.connect(leftPan);
      right.connect(rightPan);
      leftPan.connect(filter);
      rightPan.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      left.start();
      right.start();
      lfo.start();

      droneRef.current = { gain, filter, lfo, lfoDepth, left, right };

      return droneRef.current;
    };

    const unlockAudio = () => {
      unlockedRef.current = true;
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    let rafId = 0;

    const updateAudio = (time: number) => {
      const staticSound = staticRef.current;
      const padSound = padRef.current;
      const drone = unlockedRef.current ? droneRef.current ?? createDrone() : droneRef.current;

      if (unlockedRef.current && staticSound && padSound && drone) {
        const context = Howler.ctx;
        const { scrollProgress, anxietyLevel, experienceUnlocked } = useSomniaStore.getState();

        if (experienceUnlocked && context.state === "suspended") {
          void context.resume();
        }

        const chaosFade = 1 - smoothstep((scrollProgress - 0.16) / 0.54);
        const anchorFade = smoothstep((scrollProgress - 0.42) / 0.42);
        const releaseFade = smoothstep((scrollProgress - 0.78) / 0.16);
        const staticTarget = experienceUnlocked ? (0.02 + anxietyLevel * 0.07) * chaosFade : 0;
        const padTarget = experienceUnlocked ? (0.018 + anchorFade * 0.1 + releaseFade * 0.04) : 0;
        const droneTarget = experienceUnlocked
          ? 0.012 + anchorFade * 0.085 + releaseFade * 0.03
          : 0;

        if (staticTarget > 0.002) {
          if (!staticSound.playing()) {
            staticSound.play();
          }

          smoothedStaticVolumeRef.current +=
            (staticTarget - smoothedStaticVolumeRef.current) * 0.08;

          staticSound.volume(Math.min(0.14, smoothedStaticVolumeRef.current));
          staticSound.rate(0.74 + anxietyLevel * 0.08);
          staticSound.stereo(Math.sin(time * 0.00016) * 0.12);
        } else {
          smoothedStaticVolumeRef.current = 0;

          if (staticSound.playing()) {
            staticSound.stop();
          }
        }

        if (padTarget > 0.002) {
          if (!padSound.playing()) {
            padSound.play();
          }

          smoothedPadVolumeRef.current += (padTarget - smoothedPadVolumeRef.current) * 0.06;
          padSound.volume(Math.min(0.18, smoothedPadVolumeRef.current));
          padSound.rate(0.94);
        } else {
          smoothedPadVolumeRef.current = 0;

          if (padSound.playing()) {
            padSound.stop();
          }
        }

        drone.filter.frequency.setTargetAtTime(
          680 + anchorFade * 240 + releaseFade * 180,
          context.currentTime,
          0.6
        );
        drone.gain.gain.setTargetAtTime(droneTarget, context.currentTime, 0.65);
      }

      rafId = window.requestAnimationFrame(updateAudio);
    };

      rafId = window.requestAnimationFrame(updateAudio);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      staticBed.unload();
      ambientPad.unload();

      if (droneRef.current) {
        droneRef.current.left.stop();
        droneRef.current.right.stop();
        droneRef.current.lfo.stop();
        droneRef.current.left.disconnect();
        droneRef.current.right.disconnect();
        droneRef.current.lfo.disconnect();
        droneRef.current.lfoDepth.disconnect();
        droneRef.current.filter.disconnect();
        droneRef.current.gain.disconnect();
        droneRef.current = null;
      }

      staticRef.current = null;
      padRef.current = null;
    };
  }, []);

  return null;
}
