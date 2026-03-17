"use client";

import gsap from "gsap";
import { useRef, useState } from "react";
import { useSomniaStore } from "@/store/useSomniaStore";

export function AnxietyInput() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<"idle" | "submitting" | "gone">("idle");
  const preloadComplete = useSomniaStore((s) => s.preloadComplete);
  const setExperienceUnlocked = useSomniaStore((s) => s.setExperienceUnlocked);
  const setScrollUnlocked = useSomniaStore((s) => s.setScrollUnlocked);
  const setThought = useSomniaStore((s) => s.setThought);

  const trimmedValue = value.trim();

  const handleSubmit = () => {
    if (!trimmedValue || phase !== "idle") return;
    setPhase("submitting");
    setThought(trimmedValue);

    const wrapper = wrapperRef.current;
    if (wrapper) {
      gsap.to(wrapper, {
        autoAlpha: 0,
        yPercent: -6,
        duration: 0.65,
        ease: "power2.in",
        onComplete: () => {
          setExperienceUnlocked(true);
          setScrollUnlocked(true);
          setPhase("gone");
        },
      });
    } else {
      setExperienceUnlocked(true);
      setScrollUnlocked(true);
      setPhase("gone");
    }
  };

  if (!preloadComplete || phase === "gone") return null;

  return (
    <div
      ref={wrapperRef}
      className="somnia-blend-copy fixed inset-0 z-[80] flex items-center justify-center px-[8vw] text-white"
    >
      <div className="flex w-full max-w-[50rem] flex-col items-center justify-center px-[4vw] py-[5vh]">
        <h1 className="text-center font-serif text-[clamp(2.2rem,5.6vw,5.8rem)] leading-[0.94] tracking-[-0.04em] text-white">
          What is keeping you awake?
        </h1>

        <textarea
          autoFocus
          value={value}
          rows={2}
          maxLength={220}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Name it quietly..."
          className="mt-[4vh] min-h-[6.8rem] w-full resize-none border-0 bg-transparent px-0 text-center font-sans text-[clamp(1rem,1.6vw,1.35rem)] leading-[1.7] text-white/88 outline-none placeholder:text-white/28"
        />

        <button
          type="button"
          onClick={handleSubmit}
          className={`mt-[3.5vh] border-0 bg-transparent px-0 font-sans text-[clamp(0.82rem,0.95vw,0.98rem)] uppercase tracking-[0.3em] text-white transition-all duration-500 ${
            trimmedValue && phase === "idle"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0"
          }`}
        >
          [ Let it go ]
        </button>
      </div>
    </div>
  );
}
