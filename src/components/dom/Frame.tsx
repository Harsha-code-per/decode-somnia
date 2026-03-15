"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { SCROLL_DISTANCE } from "@/lib/somnia";
import { useSomniaStore } from "@/store/useSomniaStore";

gsap.registerPlugin(ScrollTrigger);

export function Frame() {
  const frameRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const progressRefs = useRef<Array<HTMLDivElement | null>>([]);
  const experienceUnlocked = useSomniaStore((state) => state.experienceUnlocked);

  useLayoutEffect(() => {
    const stage = document.querySelector<HTMLElement>("[data-somnia-stage]");

    if (!stage) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(progressRefs.current, { scaleY: 0, transformOrigin: "top center" });

      gsap.to(progressRefs.current, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: `+=${SCROLL_DISTANCE}`,
          scrub: true,
        },
      });

      gsap.to(indicatorRef.current, {
        autoAlpha: 0,
        y: 18,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "+=700",
          scrub: true,
        },
      });

    }, frameRef);

    return () => {
      context.revert();
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className={`somnia-blend-copy pointer-events-none fixed inset-0 z-50 font-sans text-white transition-opacity duration-700 ${
        experienceUnlocked ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute left-[4.5vw] top-[4.8vh] text-[clamp(0.78rem,0.9vw,0.95rem)] uppercase tracking-[0.42em]">
        SOMNIA
      </div>

      <div className="absolute right-[4.5vw] top-[4.8vh] text-right text-[clamp(0.72rem,0.82vw,0.9rem)] uppercase tracking-[0.24em] opacity-[0.8]">
        Decode &amp; Design 2026 // Entry
      </div>

      <div className="absolute inset-y-[10vh] left-[4.5vw] flex items-stretch">
        <div className="relative w-px bg-current/15">
          <div
            ref={(node) => {
              progressRefs.current[0] = node;
            }}
            className="absolute inset-x-0 top-0 h-full bg-current"
          />
        </div>
      </div>

      <div className="absolute inset-y-[10vh] right-[4.5vw] flex items-stretch">
        <div className="relative w-px bg-current/15">
          <div
            ref={(node) => {
              progressRefs.current[1] = node;
            }}
            className="absolute inset-x-0 top-0 h-full bg-current"
          />
        </div>
      </div>

      <div
        ref={indicatorRef}
        className="absolute bottom-[4.6vh] left-1/2 flex -translate-x-1/2 items-center gap-[0.75rem] text-[clamp(0.68rem,0.88vw,0.86rem)] uppercase tracking-[0.28em] opacity-[0.72]"
      >
        <span className="inline-block h-px w-[clamp(2.5rem,5vw,4.2rem)] bg-current/50" />
        <span>Scroll to Discover</span>
      </div>
    </div>
  );
}
