"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef, type ReactNode } from "react";
import { useSomniaStore } from "@/store/useSomniaStore";

gsap.registerPlugin(ScrollTrigger);

interface LenisProviderProps {
  children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<LenisRef>(null);
  const setMousePosition = useSomniaStore((state) => state.setMousePosition);
  const experienceUnlocked = useSomniaStore((state) => state.experienceUnlocked);

  useLenis(() => {
    ScrollTrigger.update();
  }, []);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      setMousePosition(x, y);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [setMousePosition]);

  useEffect(() => {
    const refreshId = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(refreshId);
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    const root = document.documentElement;
    const body = document.body;

    if (!experienceUnlocked) {
      lenis?.stop();
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";

      return () => {
        root.style.overflow = "";
        body.style.overflow = "";
      };
    }

    root.style.overflow = "";
    body.style.overflow = "";
    lenis?.start();

    const refreshId = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(refreshId);
    };
  }, [experienceUnlocked]);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.03,
        smoothWheel: true,
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
