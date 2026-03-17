"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { SCROLL_DISTANCE } from "@/lib/somnia";
import { useSomniaStore } from "@/store/useSomniaStore";

gsap.registerPlugin(ScrollTrigger);

const SCRAMBLE_CHARS = "X#9!@Q$%&*ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const scrambleText = (text: string, resolvedCharacters: number) =>
  text
    .split("")
    .map((character, index) => {
      if (character === " " || ",.:/&".includes(character)) {
        return character;
      }

      if (index < resolvedCharacters) {
        return character;
      }

      return SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
    })
    .join("");

export function Overlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const activeChapterRef = useRef(-1);
  const scrambleTweensRef = useRef<Array<gsap.core.Tween>>([]);
  const experienceUnlocked = useSomniaStore((state) => state.experienceUnlocked);
  const thought = useSomniaStore((state) => state.thought);
  const setScrollProgress = useSomniaStore((state) => state.setScrollProgress);
  const displayedThought = (thought.trim() || "this weight").replace(/[.?!]+$/g, "");
  const chapterOneTitle =
    displayedThought.length > 44
      ? `You are holding onto ${displayedThought.slice(0, 41)}...`
      : `You are holding onto ${displayedThought}.`;

  useLayoutEffect(() => {
    const stage = document.querySelector<HTMLElement>("[data-somnia-stage]");

    if (!stage) {
      return;
    }

    const context = gsap.context(() => {
      const runDecode = (chapterIndex: number) => {
        const chapter = chapterRefs.current[chapterIndex];

        if (!chapter) {
          return;
        }

        scrambleTweensRef.current.forEach((tween) => tween.kill());
        scrambleTweensRef.current = [];

        const elements = Array.from(chapter.querySelectorAll<HTMLElement>("[data-decode]"));

        elements.forEach((element, index) => {
          const finalText = element.dataset.copy ?? element.textContent ?? "";
          const state = { value: 0 };
          const delay = index * 0.05;

          gsap.set(element, {
            autoAlpha: 0,
            y: 14,
            filter: "blur(10px)",
          });
          element.textContent = scrambleText(finalText, 0);

          const revealTween = gsap.to(element, {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.62 + index * 0.07,
            delay,
            ease: "power2.out",
          });

          const scrambleTween = gsap.to(state, {
            value: finalText.length,
            duration: 0.68 + index * 0.08,
            delay,
            ease: "power2.out",
            onUpdate: () => {
              element.textContent = scrambleText(finalText, Math.floor(state.value));
            },
            onComplete: () => {
              element.textContent = finalText;
            },
          });

          scrambleTweensRef.current.push(revealTween, scrambleTween);
        });
      };

      gsap.set(chapterRefs.current, { autoAlpha: 0 });

      const masterTimeline = gsap.timeline({
        defaults: { ease: "sine.inOut" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: `+=${SCROLL_DISTANCE}`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setScrollProgress(self.progress);

            const nextChapter =
              self.progress < 0.25 ? 0 : self.progress < 0.6 ? 1 : self.progress < 0.85 ? 2 : 3;

            if (activeChapterRef.current !== nextChapter) {
              activeChapterRef.current = nextChapter;
              runDecode(nextChapter);
            }
          },
          onRefresh: (self) => {
            setScrollProgress(self.progress);
          },
        },
      });

      masterTimeline.fromTo(
        chapterRefs.current[0],
        { autoAlpha: 0, xPercent: -6, yPercent: 6 },
        { autoAlpha: 1, xPercent: 0, yPercent: 0, duration: 1.3 },
        0.15
      );
      masterTimeline.to(
        chapterRefs.current[0],
        { autoAlpha: 0, yPercent: -8, duration: 0.95 },
        3.15
      );

      masterTimeline.fromTo(
        chapterRefs.current[1],
        { autoAlpha: 0, xPercent: 8, yPercent: 4 },
        { autoAlpha: 1, xPercent: 0, yPercent: 0, duration: 1.2 },
        3.55
      );
      masterTimeline.to(
        chapterRefs.current[1],
        { autoAlpha: 0, xPercent: -4, duration: 0.95 },
        7.65
      );

      masterTimeline.fromTo(
        chapterRefs.current[2],
        { autoAlpha: 0, yPercent: 10, scale: 0.98 },
        { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1.2 },
        8.05
      );
      masterTimeline.to(
        chapterRefs.current[2],
        { autoAlpha: 0, yPercent: -8, duration: 0.95 },
        10.95
      );

      masterTimeline.fromTo(
        chapterRefs.current[3],
        { autoAlpha: 0, xPercent: 6, yPercent: 6 },
        { autoAlpha: 1, xPercent: 0, yPercent: 0, duration: 1.25 },
        11.3
      );
    }, overlayRef);

    const refreshId = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(refreshId);
      scrambleTweensRef.current.forEach((tween) => tween.kill());
      scrambleTweensRef.current = [];
      setScrollProgress(0);
      context.revert();
    };
  }, [setScrollProgress]);

  return (
    <div
      ref={overlayRef}
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-700 ${
        experienceUnlocked ? "opacity-100" : "opacity-0"
      }`}
    >
      <div ref={textLayerRef} className="somnia-blend-copy absolute inset-0 text-white">
        <section
          ref={(node) => {
            chapterRefs.current[0] = node;
          }}
          className="absolute inset-0"
        >
          <div className="somnia-blend-copy absolute left-[8vw] top-[18vh] w-[min(82vw,41rem)] max-md:left-1/2 max-md:top-[19vh] max-md:-translate-x-1/2">
            <p
              data-copy="Hold"
              data-decode
              className="font-sans text-[clamp(0.72rem,0.94vw,0.92rem)] uppercase tracking-[0.34em] opacity-[0.72]"
            >
              Hold
            </p>
            <h1
              data-copy={chapterOneTitle}
              data-decode
              className="mt-[2.6vh] font-serif text-[clamp(2.8rem,6.3vw,7.2rem)] leading-[0.9] tracking-[-0.04em]"
            >
              {chapterOneTitle}
            </h1>
            <p
              data-copy="It feels immovable only while it stays unnamed. Once it is outside you, it becomes something visible, unstable, and ready to change."
              data-decode
              className="mt-[3.2vh] max-w-[34ch] font-sans text-[clamp(0.94rem,1.2vw,1.14rem)] leading-[1.72] opacity-[0.82]"
            >
              It feels immovable only while it stays unnamed. Once it is outside you,
              it becomes something visible, unstable, and ready to change.
            </p>
          </div>

          <p className="absolute bottom-[12vh] right-[8vw] font-sans text-[clamp(6rem,18vw,16rem)] leading-none tracking-[-0.08em] text-white opacity-[0.1] max-md:hidden">
            01
          </p>
        </section>

        <section
          ref={(node) => {
            chapterRefs.current[1] = node;
          }}
          className="absolute inset-0"
        >
          <div className="somnia-blend-copy absolute right-[8vw] top-[23vh] w-[min(82vw,39rem)] text-right max-md:left-1/2 max-md:right-auto max-md:top-[24vh] max-md:w-[84vw] max-md:-translate-x-1/2 max-md:text-left">
            <p
              data-copy="Break"
              data-decode
              className="font-sans text-[clamp(0.72rem,0.94vw,0.92rem)] uppercase tracking-[0.34em] opacity-[0.72]"
            >
              Break
            </p>
            <h2
              data-copy="Watch it break. It is only weight."
              data-decode
              className="mt-[2.6vh] font-serif text-[clamp(2.6rem,5.8vw,6.35rem)] leading-[0.91] tracking-[-0.038em]"
            >
              Watch it break. It is only weight.
            </h2>
            <p
              data-copy="The force was never the truth. It was repetition. It was pressure. It can fracture, scatter, and stop claiming all of the room."
              data-decode
              className="mt-[3.2vh] ml-auto max-w-[35ch] font-sans text-[clamp(0.94rem,1.2vw,1.14rem)] leading-[1.72] opacity-[0.82] max-md:ml-0"
            >
              The force was never the truth. It was repetition. It was pressure. It can
              fracture, scatter, and stop claiming all of the room.
            </p>
          </div>

          <p className="absolute left-[8vw] top-[14vh] font-sans text-[clamp(6rem,17vw,15rem)] leading-none tracking-[-0.08em] text-white opacity-[0.1] max-md:hidden">
            02
          </p>
        </section>

        <section
          ref={(node) => {
            chapterRefs.current[2] = node;
          }}
          className="absolute inset-0"
        >
          <div className="somnia-blend-copy absolute left-[8vw] bottom-[17vh] w-[min(84vw,42rem)] max-md:left-1/2 max-md:bottom-[18vh] max-md:-translate-x-1/2">
            <p
              data-copy="Breathe"
              data-decode
              className="font-sans text-[clamp(0.72rem,0.94vw,0.92rem)] uppercase tracking-[0.34em] opacity-[0.72]"
            >
              Breathe
            </p>
            <h2
              data-copy="Pull the fragments together. Breathe."
              data-decode
              className="mt-[2.6vh] font-serif text-[clamp(2.55rem,5.95vw,6.45rem)] leading-[0.9] tracking-[-0.04em]"
            >
              Pull the fragments together. Breathe.
            </h2>
            <p
              data-copy="Give the scattered pieces one rhythm to follow. Four seconds in. Six seconds out. Let the light teach the body how to settle."
              data-decode
              className="mt-[3.2vh] max-w-[36ch] font-sans text-[clamp(0.94rem,1.2vw,1.14rem)] leading-[1.72] opacity-[0.82]"
            >
              Give the scattered pieces one rhythm to follow. Four seconds in. Six
              seconds out. Let the light teach the body how to settle.
            </p>
          </div>

          <p className="absolute right-[8vw] top-[12vh] font-sans text-[clamp(6rem,17vw,15rem)] leading-none tracking-[-0.08em] text-white opacity-[0.1] max-md:hidden">
            03
          </p>
        </section>

        <section
          ref={(node) => {
            chapterRefs.current[3] = node;
          }}
          className="absolute inset-0"
        >
          <div className="somnia-blend-copy absolute right-[8vw] bottom-[18vh] w-[min(82vw,36rem)] text-right max-md:left-1/2 max-md:right-auto max-md:bottom-[18vh] max-md:w-[84vw] max-md:-translate-x-1/2 max-md:text-left">
            <p
              data-copy="Sleep"
              data-decode
              className="font-sans text-[clamp(0.72rem,0.94vw,0.92rem)] uppercase tracking-[0.34em] opacity-[0.72]"
            >
              Sleep
            </p>
            <h2
              data-copy="The night is quiet now. Rest."
              data-decode
              className="mt-[2.6vh] font-serif text-[clamp(2.8rem,6.1vw,6.8rem)] leading-[0.89] tracking-[-0.042em]"
            >
              The night is quiet now. Rest.
            </h2>
          </div>

          <p className="absolute left-[8vw] top-[12vh] font-sans text-[clamp(6rem,17vw,15rem)] leading-none tracking-[-0.08em] text-white opacity-[0.1] max-md:hidden">
            04
          </p>
        </section>
      </div>
    </div>
  );
}
