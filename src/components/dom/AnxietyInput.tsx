"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { useSomniaStore } from "@/store/useSomniaStore";

export function AnxietyInput() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setExperienceUnlocked = useSomniaStore((state) => state.setExperienceUnlocked);
  const setReleaseProgress = useSomniaStore((state) => state.setReleaseProgress);
  const setThought = useSomniaStore((state) => state.setThought);

  useEffect(() => {
    setReleaseProgress(0);
  }, [setReleaseProgress]);

  useEffect(() => {
    const field = fieldRef.current;

    if (!field) {
      return;
    }

    field.focus();
  }, []);

  const trimmedValue = value.trim();

  const handleSubmit = () => {
    if (!trimmedValue || isSubmitting) {
      return;
    }

    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    const prompt = promptRef.current;
    const field = fieldRef.current;
    const button = buttonRef.current;

    if (!wrapper || !card || !prompt || !field || !button) {
      return;
    }

    setIsSubmitting(true);
    setThought(trimmedValue);
    setExperienceUnlocked(true);

    const burstState = { value: 0 };
    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        setReleaseProgress(1);
        setIsVisible(false);
      },
    });

    timeline.to(
      burstState,
      {
        value: 1,
        duration: 1.35,
        ease: "expo.out",
        onUpdate: () => {
          setReleaseProgress(burstState.value);
        },
      },
      0
    );
    timeline.to(
      prompt,
      { autoAlpha: 0, yPercent: -22, duration: 0.38, ease: "power2.in" },
      0
    );
    timeline.to(
      field,
      { autoAlpha: 0, yPercent: -10, filter: "blur(18px)", duration: 0.42, ease: "power2.in" },
      0.04
    );
    timeline.to(
      button,
      { autoAlpha: 0, yPercent: 14, duration: 0.28, ease: "power2.in" },
      0
    );
    timeline.to(
      card,
      { scale: 0.92, autoAlpha: 0, filter: "blur(28px)", duration: 0.6, ease: "power3.in" },
      0.14
    );
    timeline.to(wrapper, { autoAlpha: 0, duration: 0.44, ease: "power2.in" }, 0.32);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(92,28,120,0.18),rgba(5,4,10,0.92)_48%,rgba(5,4,10,1)_100%)] px-[8vw]"
    >
      <div
        ref={cardRef}
        className="flex w-full max-w-[48rem] flex-col items-center justify-center"
      >
        <h1
          ref={promptRef}
          className="text-center font-serif text-[clamp(2.2rem,5.6vw,5.8rem)] leading-[0.94] tracking-[-0.04em] text-white"
        >
          What is keeping you awake?
        </h1>

        <textarea
          ref={fieldRef}
          value={value}
          rows={2}
          maxLength={220}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Name it quietly..."
          className="mt-[4vh] min-h-[6.8rem] w-full resize-none border-0 bg-transparent px-0 text-center font-sans text-[clamp(1rem,1.6vw,1.35rem)] leading-[1.7] text-white/88 outline-none placeholder:text-white/28"
        />

        <button
          ref={buttonRef}
          type="button"
          onClick={handleSubmit}
          className={`mt-[3.5vh] border-0 bg-transparent px-0 font-sans text-[clamp(0.82rem,0.95vw,0.98rem)] uppercase tracking-[0.3em] text-white transition-all duration-500 ${
            trimmedValue
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
