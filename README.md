# Somnia — Decode & Design

An immersive, scroll-driven WebGL narrative about overthinking, release, and rest.  
This README reflects the **current codebase exactly**.

## Stack (current)

- **Framework:** Next.js `16.1.6` (App Router)
- **Runtime/UI:** React `19.2.3`, React DOM `19.2.3`, TypeScript (strict mode)
- **Rendering:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
- **Animation/Scroll:** GSAP + `ScrollTrigger`, Lenis (`lenis/react`)
- **State:** Zustand
- **Audio:** Howler
- **Styling:** Tailwind CSS v4 + custom global CSS (`src/styles/globals.css`)
- **Linting:** ESLint 9 + Next core-web-vitals + Next TypeScript config

## Scripts

```bash
npm run dev    # local dev server
npm run build  # production build
npm run start  # serve production build
npm run lint   # lint project
```

## Experience flow (actual runtime behavior)

1. `Preloader` runs first (`000%` → `100%`) and sets `preloadComplete=true`.

2. `AnxietyInput` appears only after preload. The user enters text (`maxLength=220`) and submits with:
   - click `[ Let it go ]`, or
   - `Cmd/Ctrl + Enter`.

3. On submit, the input fades out and store flags are set:
   - `thought`
   - `experienceUnlocked=true`
   - `scrollUnlocked=true`

4. Once unlocked:
   - DOM frame + overlay fade in.
   - WebGL scene fades in.
   - Lenis scrolling is enabled.

5. Scroll drives the entire narrative via GSAP `ScrollTrigger` pinned timeline (`SCROLL_DISTANCE = 15000`).

## Narrative / design model

### Overlay chapter ranges (`src/components/dom/Overlay.tsx`)

- **Chapter 1 (Hold):** progress `< 0.25`  
  Title is personalized from user text: `You are holding onto ...`
- **Chapter 2 (Break):** `0.25 .. < 0.6`
- **Chapter 3 (Breathe):** `0.6 .. < 0.85`
- **Chapter 4 (Sleep):** `>= 0.85`

Each chapter uses a scramble/decode text reveal (`data-decode`) when it becomes active.

### Store act ranges (`src/store/useSomniaStore.ts`)

- **Act 1:** progress `< 0.2`
- **Act 2:** `0.2 .. < 0.5`
- **Act 3:** `0.5 .. < 0.8`
- **Act 4:** `>= 0.8`

### Anxiety curve (`useSomniaStore`)

- `1.0` while progress `<= 0.18`
- then smooth decline to `0` between `0.18` and `0.84`
- `0` after `0.84`

## Shared state contract (`useSomniaStore`)

Core fields used across DOM, canvas, and audio:

- `scrollProgress` (`0..1`)
- `anxietyLevel` (`0..1`)
- `act` (`1 | 2 | 3 | 4`)
- `mousePosition` (`x,y` normalized `-1..1`)
- `preloadComplete`
- `experienceUnlocked`
- `scrollUnlocked`
- `shatterProgress` (`0..1`, currently not consumed)
- `thought` (user input string)

## Rendering design (WebGL)

### Mounted scene (`src/components/canvas/Scene.tsx`)

- Fixed full-screen `<Canvas>`
- Camera: `[0,0,4]`, `fov:42`, `near:0.1`, `far:30`
- `AdaptiveDpr`, black background, antialias disabled
- Mounted content:
  - `SomniaParticles`
  - `EffectComposer` with `Bloom` (intensity `2.0`)

### Particle system (`SomniaParticles.tsx`)

- `260000` particles in a custom raw shader pipeline
- Morph phases: **eyes vortex → chaos field → breathing orb → dust/release**
- Mouse repulsion + swirl from normalized pointer input
- Breath cycle uniforms: **4s in / 6s out**
- Color transition: crimson/violet (early) to cyan/white (late)

### Present but currently unused

- `src/components/canvas/FogPlane.tsx`
- `src/components/canvas/Effects.tsx`

Both exist in code but are **not mounted** in `Scene.tsx`.

## Audio design

`AudioDirector` polls store state on `requestAnimationFrame` and drives `audioManager`:

- Drone starts/fades in after unlock + progress `>= 0.25`
- Drone fades out if user goes back before threshold
- Voice cue thresholds:
  - `chaos` at `>= 0.25`
  - `breathe` at `>= 0.6`
  - `sleep` at `>= 0.85`
- Voice transitions are cross-faded (`320ms` out, `420ms` in)
- Audio context unlock is triggered by first `pointerdown` or `keydown`

Referenced files:

- `/public/audio/ambient_drone.mp3`
- `/public/audio/vo_chaos.mp3`
- `/public/audio/vo_breathe.mp3`
- `/public/audio/vo_sleep.mp3`

Additional assets present but currently unused by `audioManager.ts`:

- `/public/audio/calm-chord.wav`
- `/public/audio/whispers.wav`

## Interaction + visual language

- Custom blend-mode cursor (`Cursor.tsx`) for fine pointers
- Frame chrome with dual vertical progress bars (`Frame.tsx`)
- Typography:
  - `Space Mono` (sans)
  - `Playfair Display` (serif)
- Global mix/blend styling token: `.somnia-blend-copy`

## Codebase map

```text
src/
  app/
    layout.tsx         # fonts, metadata, LenisProvider wrapper
    page.tsx           # root composition of all scene/UI layers
  components/
    LenisProvider.tsx  # smooth scroll, pointer normalization, scroll lock/unlock
    canvas/
      Scene.tsx
      SomniaParticles.tsx
      Effects.tsx      # currently unused
      FogPlane.tsx     # currently unused
    dom/
      Preloader.tsx
      AnxietyInput.tsx
      Overlay.tsx
      Frame.tsx
      Cursor.tsx
      AudioDirector.tsx
  lib/
    somnia.ts          # SCROLL_DISTANCE constant
    audioManager.ts    # Howler wrapper and cue transitions
  store/
    useSomniaStore.ts  # shared global state
  styles/
    globals.css
```

## Project conventions reflected in code

- Shared cross-layer values live in Zustand, not duplicated local state.
- Scroll-linked systems reuse `SCROLL_DISTANCE` from `src/lib/somnia.ts`.
- Pointer is normalized before storage (`-1..1`).
- Scroll/progress values are clamped to `0..1`.
- Import alias is configured as `@/* -> src/*` in `tsconfig.json`.

## Testing status

- No `test` script exists in `package.json`.
- No test files (`*.test.*`, `*.spec.*`) are currently present under `src/`.
