# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Single-Page Application (SPA) — static marketing landing page with no routing, no backend API calls, and no state management layer beyond local component state.

**Key Characteristics:**
- Purely presentational: all data is hardcoded inline in component files; there is no data-fetching layer
- Scroll-driven visual: a full-viewport canvas animation (`DataWave3D`) is mounted fixed to the background; all section content renders on top of it with `z-index` layering
- No routing: the entire site is a single scrollable page with anchor-link navigation (`#servicos`, `#sobre`, `#contato`, `#a-escolha`)
- Entry key exists for Gemini AI (`@google/genai` in dependencies, `GEMINI_API_KEY` in environment) but no integration code is present in any component — the SDK is currently unused in source

## Layers

**Shell / Mount Layer:**
- Purpose: Bootstrap React into the DOM
- Location: `src/main.tsx`
- Contains: `createRoot` call, `StrictMode` wrapper, global CSS import
- Depends on: `src/App.tsx`, `src/index.css`
- Used by: Nothing — this is the entry point

**Root Composition Layer:**
- Purpose: Assemble all sections into a single page layout with correct z-index stacking
- Location: `src/App.tsx`
- Contains: Import and arrangement of all section components; outer wrapper div with global background color and font class
- Depends on: All components under `src/components/`
- Used by: `src/main.tsx`

**Visual Background Layer:**
- Purpose: Full-viewport animated 3D tsunami wave rendered on an HTML `<canvas>` element; fixed-position, pointer-events disabled, `z-index: 0`
- Location: `src/components/DataWave3D.tsx`
- Contains: Canvas ref, `useEffect`-based imperative `requestAnimationFrame` render loop, scroll event listener that controls wave progression
- Depends on: No external libraries — pure Canvas 2D API
- Used by: `src/App.tsx` (rendered before `<main>`)

**Navigation Layer:**
- Purpose: Fixed top navbar with logo, anchor links, mobile hamburger menu
- Location: `src/components/Navbar.tsx`
- Contains: `useState` for mobile menu toggle, `motion.nav` entry animation
- Depends on: `motion/react`, `lucide-react`
- Used by: `src/App.tsx`

**Section Components Layer:**
- Purpose: Individual full-width page sections stacked vertically inside `<main>`
- Location: `src/components/`
- Contains: Pure presentational React components; each section manages its own scroll-triggered entrance animation via `useInView` + `motion`
- Depends on: `motion/react`, `lucide-react`; no cross-component dependencies
- Used by: `src/App.tsx`

## Data Flow

**Page Render:**

1. Browser loads `index.html`, which mounts `/src/main.tsx` as an ES module
2. `main.tsx` calls `createRoot` on `#root` and renders `<App>`
3. `App` renders `<DataWave3D />` (fixed background) and `<main>` containing all sections
4. Each section independently triggers its entrance animation when scrolled into view via `useInView`

**Scroll Animation:**

1. `DataWave3D` attaches a passive `scroll` event listener on mount
2. `window.scrollY / maxScroll` normalises scroll position to `[0, 1]`
3. Each animation frame: `currentScroll` lerps toward `targetScroll` (factor 0.05)
4. `currentScroll` drives wave height amplitude, tsunami Z-depth, camera Y/Z offsets, and background fade-out

**Section Entrance Animation:**

1. `useInView` (from `motion/react`) observes the section's container ref with `{ once: true, margin: "-100px" }`
2. When element enters viewport, `isInView` becomes `true`
3. `motion` elements transition from their `initial` state to the `animate` state keyed on `isInView`

**State Management:**
- No global state. The only component-level state is `isOpen: boolean` in `Navbar.tsx` (mobile menu toggle)

## Key Abstractions

**`glass-card` Utility Class:**
- Purpose: Consistent frosted-glass card appearance across all section cards
- Defined in: `src/index.css` (`@layer utilities`)
- Pattern: `background: rgba(255,255,255,0.02)`, `backdrop-filter: blur(20px)`, border with `rgba(255,255,255,0.05)`; hover darkens border

**Design Tokens (CSS Custom Properties):**
- Purpose: Centralised palette — `--color-bg-base`, `--color-accent`, `--color-muted`, font stacks
- Defined in: `src/index.css` (`@theme` block, Tailwind v4 syntax)
- Pattern: Referenced throughout component JSX via Tailwind classes (`bg-bg-base`, `text-muted`, `text-accent`)

**`DataWave3D` Canvas Component:**
- Purpose: Scroll-driven animated 3D wireframe wave — sole source of the site's visual identity
- Examples: `src/components/DataWave3D.tsx`
- Pattern: Imperative `useEffect` canvas loop; returns a cleanup function that removes event listeners and cancels animation

## Entry Points

**Browser Entry:**
- Location: `index.html`
- Triggers: Browser navigation / page load
- Responsibilities: Defines `<div id="root">`, loads `src/main.tsx` as ES module

**Application Entry:**
- Location: `src/main.tsx`
- Triggers: Script module evaluation by browser
- Responsibilities: Imports global CSS, creates React root, renders `<App>` wrapped in `<StrictMode>`

**Dev Server Entry:**
- Location: `vite.config.ts`
- Triggers: `npm run dev` (Vite at port 3000, host 0.0.0.0)
- Responsibilities: Registers `@vitejs/plugin-react` and `@tailwindcss/vite`, exposes `GEMINI_API_KEY` env var via `define`, sets `@` path alias to project root

## Error Handling

**Strategy:** None implemented. No error boundaries exist. No `try/catch` blocks are present. Failed image loads (e.g., `/raul-pedro.png`) degrade silently — the `<img>` renders broken.

**Patterns:**
- No React error boundaries
- No fallback UI for missing assets
- Canvas `getContext('2d')` failure causes early return (silent no-render)

## Cross-Cutting Concerns

**Logging:** None — no `console.log` or logging library used in production paths.

**Validation:** Not applicable — no forms or user inputs exist yet. CTA buttons are non-functional (`href="#"`, no `onClick` handlers).

**Authentication:** None. Fully public static site.

**Gemini API:** `@google/genai` is installed and `GEMINI_API_KEY` is wired through `vite.config.ts`, but no component currently calls the SDK. It is scaffolded and ready to use.

---

*Architecture analysis: 2026-04-02*
