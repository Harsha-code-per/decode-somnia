# Copilot instructions for `decode-somnia`

## Build, run, and lint commands

- Install dependencies: `npm install`
- Start local dev server: `npm run dev` (serves on `http://localhost:3000`)
- Build production bundle: `npm run build`
- Run production server: `npm run start`
- Lint entire project: `npm run lint`
- Lint a single file: `npm run lint -- src/components/dom/Overlay.tsx`

## Tests

- No test runner is currently configured in `package.json` (no `test` script).
- No test files are present under `src/` (`*.test.*` / `*.spec.*`).

## High-level architecture

- The app is a single-page Next.js App Router experience.
  - `src/app/layout.tsx` sets fonts/styles and wraps the app with `LenisProvider`.
  - `src/app/page.tsx` composes all layers: preload, cursor/frame, WebGL scene, overlay narrative, audio, and text input unlock.

- `src/store/useSomniaStore.ts` is the shared state hub across DOM, canvas, and audio.
  - Core shared signals: `scrollProgress`, `act`, `anxietyLevel`, `mousePosition`, preload/unlock flags, and user `thought`.

- Scroll progression is the main driver for narrative and visuals.
  - `src/components/dom/Overlay.tsx` pins and scrubs the staged narrative with GSAP `ScrollTrigger`.
  - `src/components/dom/Frame.tsx` uses the same scroll distance constant to keep side progress bars synchronized.
  - `src/lib/somnia.ts` defines `SCROLL_DISTANCE`, reused by scroll-driven components.

- Rendering pipeline:
  - `src/components/canvas/Scene.tsx` hosts the React Three Fiber `<Canvas>`.
  - `SomniaParticles.tsx` renders the primary instanced-shader particle system.
  - `Effects.tsx` applies postprocessing (`Bloom`, `DepthOfField`) and adapts intensity from store progress.

- Experience gating and audio:
  - `Preloader.tsx` controls initial preload reveal (`preloadComplete`).
  - `AnxietyInput.tsx` captures user input and unlocks scrolling/experience.
  - `AudioDirector.tsx` mixes loops/synthesis from `public/audio/*` based on shared state over an animation frame loop.

## Key codebase conventions

- Use the Zustand store (`useSomniaStore`) for cross-layer state. Avoid duplicating progression state in component-local state.
- In per-frame loops (`useFrame`, `requestAnimationFrame`), read store values with `useSomniaStore.getState()` to avoid React re-render pressure.
- Keep scroll-linked systems aligned by reusing `SCROLL_DISTANCE` from `src/lib/somnia.ts` rather than introducing component-local scroll ranges.
- For GSAP/ScrollTrigger setup, use `useLayoutEffect` + `gsap.context(...)` and always clean up with `context.revert()`.
- Maintain normalized value ranges used across the app:
  - scroll/progression values are clamped to `0..1`
  - pointer coordinates are normalized to `-1..1` before storage
- Follow import aliasing from `tsconfig.json` (`@/*` → `src/*`) instead of deep relative imports.
- Keep layering split by responsibility:
  - WebGL/rendering in `src/components/canvas/*`
  - Narrative/UI/interactions in `src/components/dom/*`
