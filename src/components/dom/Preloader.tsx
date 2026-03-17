"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";
import { useSomniaStore } from "@/store/useSomniaStore";

export function Preloader() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const setPreloadComplete = useSomniaStore((state) => state.setPreloadComplete);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const counter = counterRef.current;
    const subtitle = subtitleRef.current;
    const line = lineRef.current;

    setPreloadComplete(false);

    if (!wrapper || !counter || !subtitle || !line) {
      return;
    }

    const state = { value: 0 };

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        setPreloadComplete(true);
        setIsVisible(false);
      },
    });

    // Count 0→100% with a smooth easing curve
    tl.to(state, {
      value: 100,
      duration: 1.6,
      ease: "power1.inOut",
      onUpdate: () => {
        if (counter) counter.textContent = `${Math.floor(state.value).toString().padStart(3, "0")}%`;
      },
    });

    // Line sweeps in underneath
    tl.fromTo(line,
      { scaleX: 0, transformOrigin: "left center" },
      { scaleX: 1, duration: 1.6, ease: "power1.inOut" },
      "<"
    );

    // Subtitle fades in mid-way
    tl.fromTo(subtitle,
      { autoAlpha: 0, yPercent: 12 },
      { autoAlpha: 0.6, yPercent: 0, duration: 0.6 },
      "-=0.8"
    );

    // Everything fades out
    tl.to(wrapper, {
      autoAlpha: 0,
      duration: 0.7,
      ease: "power2.inOut",
      delay: 0.18,
    });

    return () => {
      tl.kill();
    };
  }, [setPreloadComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      className="somnia-blend-copy pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white"
    >
      <span
        ref={counterRef}
        className="font-sans text-[clamp(4rem,14vw,12rem)] tabular-nums leading-none tracking-[-0.04em] text-white"
      >
        000%
      </span>

      <p className="mt-[2.6vh] font-sans text-[clamp(0.68rem,0.92vw,0.9rem)] uppercase tracking-[0.38em] text-white/58">
        Loading Into Insomnia
      </p>

      <div className="mt-[2.1vh] h-[0.24rem] w-[clamp(10rem,24vw,22rem)] overflow-hidden rounded-full bg-white/14">
        <div ref={lineRef} className="h-full w-full rounded-full bg-white/78" />
      </div>

      <p
        ref={subtitleRef}
        className="mt-[2.2vh] font-sans text-[clamp(0.65rem,0.9vw,0.88rem)] uppercase tracking-[0.38em] text-white opacity-0"
      >
        Entering Somnia
      </p>
    </div>
  );
}
