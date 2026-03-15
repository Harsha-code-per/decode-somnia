"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";

export function Preloader() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        gsap.set(wrapper, { display: "none" });
      },
    });

    timeline.fromTo(
      titleRef.current,
      { opacity: 0, yPercent: 15, letterSpacing: "0.45em" },
      { opacity: 1, yPercent: 0, letterSpacing: "0.22em", duration: 0.8 }
    );
    timeline.fromTo(
      subtitleRef.current,
      { opacity: 0, yPercent: 16 },
      { opacity: 0.78, yPercent: 0, duration: 0.55 },
      "-=0.42"
    );
    timeline.fromTo(
      barRef.current,
      { scaleX: 0, transformOrigin: "left center" },
      { scaleX: 1, duration: 0.75, ease: "power1.inOut" },
      "-=0.2"
    );
    timeline.to(wrapper, { opacity: 0, duration: 0.9, ease: "power2.inOut", delay: 0.2 });

    return () => {
      timeline.kill();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#05040a] text-white"
    >
      <h1
        ref={titleRef}
        className="text-[clamp(2rem,7vw,7rem)] uppercase tracking-[0.22em]"
      >
        Somnia
      </h1>
      <p
        ref={subtitleRef}
        className="mt-[2vh] text-[clamp(0.72rem,1.05vw,1.02rem)] uppercase tracking-[0.24em]"
      >
        finding the anchor
      </p>
      <div className="mt-[4vh] h-[0.18vh] w-[clamp(10rem,28vw,26rem)] bg-white/20">
        <div ref={barRef} className="h-full w-full bg-white/85" />
      </div>
    </div>
  );
}
