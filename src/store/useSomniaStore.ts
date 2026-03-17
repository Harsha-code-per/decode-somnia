import { create } from "zustand";

export type SomniaAct = 1 | 2 | 3 | 4;

interface MousePosition {
  x: number;
  y: number;
}

interface SomniaStore {
  scrollProgress: number;
  anxietyLevel: number;
  act: SomniaAct;
  mousePosition: MousePosition;
  preloadComplete: boolean;
  experienceUnlocked: boolean;
  scrollUnlocked: boolean;
  shatterProgress: number;
  thought: string;
  setScrollProgress: (value: number) => void;
  setMousePosition: (x: number, y: number) => void;
  setPreloadComplete: (value: boolean) => void;
  setExperienceUnlocked: (value: boolean) => void;
  setScrollUnlocked: (value: boolean) => void;
  setShatterProgress: (value: number) => void;
  setThought: (value: string) => void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const clampSigned = (value: number) => Math.min(1, Math.max(-1, value));

const smoothstep = (value: number) => value * value * (3 - 2 * value);

const computeAct = (progress: number): SomniaAct => {
  if (progress < 0.2) {
    return 1;
  }

  if (progress < 0.5) {
    return 2;
  }

  if (progress < 0.8) {
    return 3;
  }

  return 4;
};

const computeAnxiety = (progress: number) => {
  if (progress <= 0.18) {
    return 1;
  }

  if (progress <= 0.84) {
    return 1 - smoothstep((progress - 0.18) / 0.66);
  }

  return 0;
};

export const useSomniaStore = create<SomniaStore>((set) => ({
  scrollProgress: 0,
  anxietyLevel: 0,
  act: 1,
  mousePosition: { x: 0, y: 0 },
  preloadComplete: false,
  experienceUnlocked: false,
  scrollUnlocked: false,
  shatterProgress: 0,
  thought: "",
  setScrollProgress: (value) => {
    const progress = clamp01(value);

    set({
      scrollProgress: progress,
      anxietyLevel: clamp01(computeAnxiety(progress)),
      act: computeAct(progress),
    });
  },
  setMousePosition: (x, y) => {
    set({
      mousePosition: {
        x: clampSigned(x),
        y: clampSigned(y),
      },
    });
  },
  setPreloadComplete: (value) => {
    set({
      preloadComplete: value,
    });
  },
  setExperienceUnlocked: (value) => {
    set({
      experienceUnlocked: value,
    });
  },
  setScrollUnlocked: (value) => {
    set({
      scrollUnlocked: value,
    });
  },
  setShatterProgress: (value) => {
    set({
      shatterProgress: clamp01(value),
    });
  },
  setThought: (value) => {
    set({
      thought: value,
    });
  },
}));
