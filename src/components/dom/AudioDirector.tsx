"use client";

import { useEffect, useRef } from "react";
import { getAudioManager, type VoiceCue } from "@/lib/audioManager";
import { useSomniaStore } from "@/store/useSomniaStore";

const CHAOS_THRESHOLD = 0.25;
const BREATHE_THRESHOLD = 0.6;
const SLEEP_THRESHOLD = 0.85;

const resolveVoiceCue = (progress: number): VoiceCue | null => {
  if (progress >= SLEEP_THRESHOLD) {
    return "sleep";
  }

  if (progress >= BREATHE_THRESHOLD) {
    return "breathe";
  }

  if (progress >= CHAOS_THRESHOLD) {
    return "chaos";
  }

  return null;
};

export function AudioDirector() {
  const activeCueRef = useRef<VoiceCue | null>(null);
  const droneArmedRef = useRef(false);
  const rafIdRef = useRef(0);

  useEffect(() => {
    const audio = getAudioManager();
    audio.initialize();

    const unlockAudio = () => {
      void audio.unlock();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    const tick = () => {
      const { experienceUnlocked, scrollProgress } = useSomniaStore.getState();
      const phaseTwoStarted = experienceUnlocked && scrollProgress >= CHAOS_THRESHOLD;

      if (phaseTwoStarted && !droneArmedRef.current) {
        droneArmedRef.current = true;
        audio.fadeDroneTo(0.4, 3000);
      }

      if (!phaseTwoStarted && droneArmedRef.current) {
        droneArmedRef.current = false;
        audio.fadeDroneTo(0, 450);
      }

      const nextCue = experienceUnlocked ? resolveVoiceCue(scrollProgress) : null;

      if (nextCue !== activeCueRef.current) {
        audio.setVoiceCue(nextCue);
        activeCueRef.current = nextCue;
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    rafIdRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      audio.stopAll();
    };
  }, []);

  return null;
}
