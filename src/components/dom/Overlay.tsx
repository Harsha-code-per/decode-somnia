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
  const setScrollProgress = useSomniaStore((state) => state.setScrollProgress);

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

          element.textContent = finalText;

          const tween = gsap.to(state, {
            value: finalText.length,
            duration: 0.68 + index * 0.08,
            delay: index * 0.05,
            ease: "power2.out",
            onUpdate: () => {
              element.textContent = scrambleText(finalText, Math.floor(state.value));
            },
            onComplete: () => {
              element.textContent = finalText;
            },
          });

          scrambleTweensRef.current.push(tween);
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
              self.progress < 0.2 ? -1 : self.progress < 0.5 ? 0 : self.progress < 0.8 ? 1 : self.progress < 0.96 ? 2 : 3;

            if (activeChapterRef.current !== nextChapter) {
              activeChapterRef.current = nextChapter;

              if (nextChapter >= 0) {
                runDecode(nextChapter);
              }
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
        3.15
      );
      masterTimeline.to(
        chapterRefs.current[0],
        { autoAlpha: 0, yPercent: -8, duration: 0.95 },
        5.95
      );

      masterTimeline.fromTo(
        chapterRefs.current[1],
        { autoAlpha: 0, xPercent: 8, yPercent: 4 },
        { autoAlpha: 1, xPercent: 0, yPercent: 0, duration: 1.2 },
        7.55
      );
      masterTimeline.to(
        chapterRefs.current[1],
        { autoAlpha: 0, xPercent: -4, duration: 0.95 },
        10.25
      );

      masterTimeline.fromTo(
        chapterRefs.current[2],
        { autoAlpha: 0, yPercent: 10, scale: 0.98 },
        { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1.2 },
        11.95
      );
      masterTimeline.to(
        chapterRefs.current[2],
        { autoAlpha: 0, yPercent: -8, duration: 0.95 },
        14.35
      );

      masterTimeline.fromTo(
        chapterRefs.current[3],
        { autoAlpha: 0, xPercent: 6, yPercent: 6 },
        { autoAlpha: 1, xPercent: 0, yPercent: 0, duration: 1.25 },
        14.95
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
      <div ref={textLayerRef} className="absolute inset-0 text-white">
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
              data-copy="We hold onto thoughts until they become walls."
              data-decode
              className="mt-[2.6vh] font-serif text-[clamp(2.8rem,6.3vw,7.2rem)] leading-[0.9] tracking-[-0.04em]"
            >
              We hold onto thoughts until they become walls.
            </h1>
            <p
              data-copy="A single unfinished thought can start to feel architectural. It hardens around the body, repeats itself, and turns the room against your rest."
              data-decode
              className="mt-[3.2vh] max-w-[34ch] font-sans text-[clamp(0.94rem,1.2vw,1.14rem)] leading-[1.72] opacity-[0.82]"
            >
              A single unfinished thought can start to feel architectural. It hardens
              around the body, repeats itself, and turns the room against your rest.
            </p>
          </div>

          <p className="absolute bottom-[12vh] right-[8vw] font-sans text-[clamp(6rem,18vw,16rem)] leading-none tracking-[-0.08em] text-white opacity-[0.1] mix-blend-overlay max-md:hidden">
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
              data-copy="Shape"
              data-decode
              className="font-sans text-[clamp(0.72rem,0.94vw,0.92rem)] uppercase tracking-[0.34em] opacity-[0.72]"
            >
              Shape
            </p>
            <h2
              data-copy="But they are just dust. You control the shape."
              data-decode
              className="mt-[2.6vh] font-serif text-[clamp(2.6rem,5.8vw,6.35rem)] leading-[0.91] tracking-[-0.038em]"
            >
              But they are just dust. You control the shape.
            </h2>
            <p
              data-copy="Once the thought is released, it loses its authority. What felt solid becomes something lighter, movable, and yours to soften."
              data-decode
              className="mt-[3.2vh] ml-auto max-w-[35ch] font-sans text-[clamp(0.94rem,1.2vw,1.14rem)] leading-[1.72] opacity-[0.82] max-md:ml-0"
            >
              Once the thought is released, it loses its authority. What felt solid
              becomes something lighter, movable, and yours to soften.
            </p>
          </div>

          <p className="absolute left-[8vw] top-[14vh] font-sans text-[clamp(6rem,17vw,15rem)] leading-none tracking-[-0.08em] text-white opacity-[0.1] mix-blend-overlay max-md:hidden">
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
              data-copy="Gather"
              data-decode
              className="font-sans text-[clamp(0.72rem,0.94vw,0.92rem)] uppercase tracking-[0.34em] opacity-[0.72]"
            >
              Gather
            </p>
            <h2
              data-copy="Breathe in. Gather the fragments."
              data-decode
              className="mt-[2.6vh] font-serif text-[clamp(2.55rem,5.95vw,6.45rem)] leading-[0.9] tracking-[-0.04em]"
            >
              Breathe in. Gather the fragments.
            </h2>
            <p
              data-copy="Let the light pull everything inward. Follow its rhythm: four seconds in, six seconds out, until the noise gives up its edges."
              data-decode
              className="mt-[3.2vh] max-w-[36ch] font-sans text-[clamp(0.94rem,1.2vw,1.14rem)] leading-[1.72] opacity-[0.82]"
            >
              Let the light pull everything inward. Follow its rhythm: four seconds in,
              six seconds out, until the noise gives up its edges.
            </p>
          </div>

          <p className="absolute right-[8vw] top-[12vh] font-sans text-[clamp(6rem,17vw,15rem)] leading-none tracking-[-0.08em] text-white opacity-[0.1] mix-blend-overlay max-md:hidden">
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
              data-copy="Rest"
              data-decode
              className="font-sans text-[clamp(0.72rem,0.94vw,0.92rem)] uppercase tracking-[0.34em] opacity-[0.72]"
            >
              Rest
            </p>
            <h2
              data-copy="The night is quiet now. Rest."
              data-decode
              className="mt-[2.6vh] font-serif text-[clamp(2.8rem,6.1vw,6.8rem)] leading-[0.89] tracking-[-0.042em]"
            >
              The night is quiet now. Rest.
            </h2>
          </div>

          <p className="absolute left-[8vw] top-[12vh] font-sans text-[clamp(6rem,17vw,15rem)] leading-none tracking-[-0.08em] text-white opacity-[0.1] mix-blend-overlay max-md:hidden">
            04
          </p>
        </section>
      </div>
    </div>
  );
}
