"use client";

import { Howl, Howler } from "howler";

export type VoiceCue = "chaos" | "breathe" | "sleep";

const DRONE_FILE = "/audio/ambient_drone.mp3";
const VOICE_FILES: Record<VoiceCue, string> = {
  chaos: "/audio/vo_chaos.mp3",
  breathe: "/audio/vo_breathe.mp3",
  sleep: "/audio/vo_sleep.mp3",
};

const VOICE_FADE_OUT_MS = 320;
const VOICE_FADE_IN_MS = 420;

class AudioManager {
  private initialized = false;
  private drone: Howl | null = null;
  private voices: Record<VoiceCue, Howl> | null = null;
  private activeCue: VoiceCue | null = null;
  private droneStarted = false;
  private transitionToken = 0;

  initialize() {
    if (this.initialized) {
      return;
    }

    Howler.autoUnlock = true;

    this.drone = new Howl({
      src: [DRONE_FILE],
      loop: true,
      volume: 0,
      preload: true,
      html5: false,
      onloaderror: (_id, error) => {
        console.error("Failed to load ambient drone:", error);
      },
    });

    this.voices = {
      chaos: new Howl({
        src: [VOICE_FILES.chaos],
        loop: false,
        volume: 0,
        preload: true,
        html5: false,
        onloaderror: (_id, error) => {
          console.error("Failed to load chaos voiceover:", error);
        },
      }),
      breathe: new Howl({
        src: [VOICE_FILES.breathe],
        loop: false,
        volume: 0,
        preload: true,
        html5: false,
        onloaderror: (_id, error) => {
          console.error("Failed to load breathe voiceover:", error);
        },
      }),
      sleep: new Howl({
        src: [VOICE_FILES.sleep],
        loop: false,
        volume: 0,
        preload: true,
        html5: false,
        onloaderror: (_id, error) => {
          console.error("Failed to load sleep voiceover:", error);
        },
      }),
    };

    this.initialized = true;
  }

  async unlock() {
    this.initialize();

    const context = Howler.ctx;

    if (context.state === "suspended") {
      await context.resume();
    }
  }

  fadeDroneTo(targetVolume: number, durationMs: number) {
    this.initialize();

    const drone = this.drone;

    if (!drone) {
      return;
    }

    if (targetVolume <= 0 && !this.droneStarted) {
      return;
    }

    if (!this.droneStarted) {
      drone.volume(0);
      drone.play();
      this.droneStarted = true;
    }

    const currentVolume = Math.max(0, drone.volume());
    drone.fade(currentVolume, targetVolume, durationMs);
  }

  setVoiceCue(nextCue: VoiceCue | null) {
    this.initialize();

    if (!this.voices || nextCue === this.activeCue) {
      return;
    }

    const transitionId = ++this.transitionToken;
    const previousCue = this.activeCue;

    const startNext = () => {
      if (!this.voices || this.transitionToken !== transitionId || !nextCue) {
        return;
      }

      const nextVoice = this.voices[nextCue];
      nextVoice.stop();
      nextVoice.volume(0);
      nextVoice.play();
      nextVoice.fade(0, 1, VOICE_FADE_IN_MS);
      this.activeCue = nextCue;
    };

    if (previousCue) {
      const previousVoice = this.voices[previousCue];
      this.activeCue = null;

      if (previousVoice.playing()) {
        previousVoice.fade(previousVoice.volume(), 0, VOICE_FADE_OUT_MS);

        globalThis.setTimeout(() => {
          if (this.transitionToken !== transitionId) {
            return;
          }

          previousVoice.stop();
          startNext();
        }, VOICE_FADE_OUT_MS + 20);

        return;
      }

      previousVoice.stop();
    }

    startNext();
  }

  stopAll() {
    this.transitionToken += 1;

    if (this.drone) {
      this.drone.stop();
      this.drone.volume(0);
      this.droneStarted = false;
    }

    if (this.voices) {
      Object.values(this.voices).forEach((voice) => {
        voice.stop();
        voice.volume(0);
      });
    }

    this.activeCue = null;
  }
}

let audioManager: AudioManager | null = null;

export const getAudioManager = () => {
  if (!audioManager) {
    audioManager = new AudioManager();
  }

  return audioManager;
};
