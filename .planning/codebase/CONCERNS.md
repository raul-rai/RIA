# Codebase Concerns

**Analysis Date:** 2026-04-02

## Tech Debt

**No animation frame cancellation in DataWave3D:**
- Issue: `requestAnimationFrame(render)` is called recursively inside `src/components/DataWave3D.tsx` (line 163) but the returned frame ID is never stored or cancelled. The cleanup function in the `useEffect` return (lines 174–177) only removes event listeners, not the running animation loop.
- Files: `src/components/DataWave3D.tsx`
- Impact: If the component ever unmounts (route change, conditional render), the animation loop continues running in the background, consuming CPU/GPU and causing memory leaks or state-update errors on unmounted components.
- Fix approach: Store the return value of `requestAnimationFrame(render)` in a variable declared outside the inner function (e.g., `let frameId: number`), and call `cancelAnimationFrame(frameId)` inside the cleanup return.

**Canvas resize handler does not cancel and restart the animation loop:**
- Issue: `handleResize` in `src/components/DataWave3D.tsx` (lines 168–171) updates `width` and `height` on the canvas element, but the render loop continues using the old closure values. The variables `width` and `height` are re-assigned inside `handleResize` but the running loop already captured a stale `halfW`/`halfH` through in-function re-computation each frame — this works incidentally because `halfW`/`halfH` are computed inside `render`, not captured. However, the outer `width`/`height` reassignment pattern is fragile and could break if the code is refactored.
- Files: `src/components/DataWave3D.tsx`
- Impact: Low risk currently, but fragile under refactor.
- Fix approach: Use a `ref` for `width`/`height` or restructure to read `canvas.width`/`canvas.height` directly inside the render loop.

**GEMINI_API_KEY exposed via `vite.config.ts` define:**
- Issue: `vite.config.ts` (line 11) injects `GEMINI_API_KEY` as `process.env.GEMINI_API_KEY` into the client bundle via Vite's `define`. This means the key is embedded in the compiled JavaScript bundle and visible to anyone who views the page source or network requests.
- Files: `vite.config.ts`
- Impact: Any deployment that provides a real Gemini API key will expose it publicly in the browser bundle. This is a critical secret leak vector.
- Fix approach: API calls requiring the Gemini key should be proxied through a server-side endpoint (the `express` package is already in `package.json` as a dependency but is unused — likely intended for this purpose). The frontend should call a local `/api/*` route which holds the key server-side.

**`express` and `dotenv` declared as production dependencies instead of dev/server dependencies:**
- Issue: `package.json` lists `express` and `dotenv` as `dependencies` (lines 21–22) alongside frontend React packages. These are server-side packages and do not belong in the frontend bundle. There is no server entry point file in the repository (no `server.ts`, `server.js`, or `api/` directory exists).
- Files: `package.json`
- Impact: Increases bundle size if accidentally imported; signals incomplete server architecture. The intended server layer has not been implemented.
- Fix approach: Either implement the Express server (create `server.ts` with API proxy routes) or move these to `devDependencies` and use Vite's proxy config for local development. For production, implement a serverless function or a separate backend service.

**`@google/genai` SDK is declared as a dependency but is not imported anywhere in the codebase:**
- Issue: `package.json` line 14 declares `@google/genai: ^1.29.0`, but no file in `src/` imports or uses it.
- Files: `package.json`
- Impact: Dead dependency. Increases install/bundle size with no current benefit. Indicates planned-but-unimplemented AI feature.
- Fix approach: Either implement the Gemini integration (with the server-side proxy approach to avoid key exposure) or remove the dependency until it is needed.

## Known Bugs

**Missing profile image asset causes broken About section:**
- Symptoms: The About section (`src/components/About.tsx`, line 64–68) references `/raul-pedro.png` which does not exist in the `public/` directory (only `public/.gitkeep` is present). An `<img>` element with a broken `src` will render as a broken image placeholder.
- Files: `src/components/About.tsx`, `public/`
- Trigger: Any page load.
- Workaround: The `glass-card` container still renders with its gradient overlays, so it degrades somewhat gracefully visually, but the image slot is visually broken.

## Security Considerations

**API key leakage via client-side Vite define:**
- Risk: `GEMINI_API_KEY` injected into the browser bundle is fully readable by any user visiting the site.
- Files: `vite.config.ts` (line 11)
- Current mitigation: The key is sourced from `.env` which is gitignored. However, any deployed build will contain the raw key value in the bundled JS.
- Recommendations: Route all Gemini API calls through a server-side endpoint. The Express server scaffold already exists in `package.json`. Do not use `define` for secrets.

**Placeholder `href="#"` on all social/action links:**
- Risk: All social links in `src/components/FinalCTA.tsx` (lines 50–61) and `src/components/Footer.tsx` (lines 14–22) use `href="#"`. The CTA buttons in `src/components/Hero.tsx` (lines 46–53) and `src/components/FinalCTA.tsx` (line 44) have no `href` or `onClick` handler.
- Files: `src/components/FinalCTA.tsx`, `src/components/Footer.tsx`, `src/components/Hero.tsx`
- Current mitigation: None. These are non-functional at launch.
- Recommendations: Replace placeholder hrefs with real URLs (WhatsApp link, LinkedIn profile URL, email mailto:). Add `onClick` to CTA buttons pointing to a booking/contact flow.

## Performance Bottlenecks

**Unbounded `requestAnimationFrame` loop running at full display refresh rate:**
- Problem: `DataWave3D` renders a 60x45 point grid (2,700 points, ~2,600+ polygon draw calls per frame) at the display's native refresh rate (typically 60–120fps) with no frame rate cap.
- Files: `src/components/DataWave3D.tsx`
- Cause: The render loop calls `requestAnimationFrame(render)` unconditionally on every frame with no throttle. On high-refresh-rate displays this runs at 120Hz or more.
- Improvement path: Throttle to 30–60fps using a timestamp delta check inside the render callback, or reduce grid resolution further for mobile devices using a media query / `window.innerWidth` check.

**No mobile performance accommodation in DataWave3D:**
- Problem: The same 60x45 grid is rendered on all devices including low-end mobile.
- Files: `src/components/DataWave3D.tsx`
- Cause: `cols = 60`, `rows = 45` are hardcoded with no device capability detection.
- Improvement path: Detect mobile via `window.innerWidth < 768` or `navigator.hardwareConcurrency` and reduce grid resolution (e.g., `cols = 30`, `rows = 22`) for mobile.

**External Unsplash images load without lazy loading:**
- Problem: `src/components/TheChoice.tsx` (lines 48, 82) loads two large Unsplash images (`?w=2070`) without `loading="lazy"` attribute.
- Files: `src/components/TheChoice.tsx`
- Cause: Missing `loading="lazy"` on `<img>` elements.
- Improvement path: Add `loading="lazy"` to both `<img>` tags. Also consider smaller image dimensions for the actual display size.

## Fragile Areas

**`DataWave3D` relies on shared mutable variables inside `useEffect` closure:**
- Files: `src/components/DataWave3D.tsx`
- Why fragile: `width`, `height`, `time`, `targetScroll`, `currentScroll`, and the `points` array are all declared as `let` / `const` inside the `useEffect` closure. The scroll and resize handlers mutate these directly. React Strict Mode (enabled in `src/main.tsx`) runs effects twice in development, which would create two competing animation loops and two sets of event listeners, with only one set being cleaned up.
- Safe modification: Be aware that any new state or side effects added to this component must be properly cancelled in the cleanup return. Test all changes in Strict Mode development.
- Test coverage: Zero — no tests exist in the project.

**Navbar mobile menu has no click-outside-to-close behavior:**
- Files: `src/components/Navbar.tsx`
- Why fragile: The mobile menu opens on toggle but only closes when a nav link or the toggle button is clicked. There is no `useEffect` listening for outside clicks. Users on mobile who tap outside the menu will leave it open.
- Safe modification: Add a `useEffect` with a `mousedown`/`touchstart` listener on `document` that calls `setIsOpen(false)` when clicking outside the menu element.
- Test coverage: None.

## Scaling Limits

**Single-page static site — no routing:**
- Current capacity: All content is a single scroll page with anchor-link navigation (`#servicos`, `#sobre`, `#contato`).
- Limit: Adding new pages (e.g., blog, case studies, service detail pages) requires introducing a routing library. There is no `react-router-dom` or similar.
- Scaling path: Add `react-router-dom` and split components into page-level routes when content volume grows.

## Dependencies at Risk

**`motion` package using non-standard import path:**
- Risk: All components import from `motion/react` (e.g., `src/components/Hero.tsx` line 1), which is the correct import for Framer Motion v12+. However, this is a relatively new API surface. The package is listed as `motion` in `package.json` (line 23) using `^12.23.24` which locks to v12 major but allows minor/patch updates that could introduce breaking changes.
- Impact: Animation library is used pervasively across all page components.
- Migration plan: No immediate action needed; pin to a specific version if stability is a concern.

**`vite` listed in both `dependencies` and `devDependencies`:**
- Risk: `package.json` lists `vite: ^6.2.0` under both `dependencies` (line 21) and `devDependencies` (line 26). This is redundant and can cause version resolution ambiguity.
- Impact: Minor — build tools typically resolve correctly, but it creates confusion and unnecessary install weight in production `node_modules` if `--production` is not used.
- Migration plan: Remove `vite` from `dependencies` and keep only in `devDependencies`.

## Missing Critical Features

**No contact form or booking integration:**
- Problem: The primary CTA buttons ("Iniciar Transformação" in `src/components/Hero.tsx`, "Agendar Sessão Estratégica" in `src/components/FinalCTA.tsx`) have no action attached. All social links are placeholder `href="#"`.
- Blocks: The site cannot convert visitors — no lead capture mechanism exists.

**No error boundary:**
- Problem: There is no React error boundary wrapping the application or any section. If `DataWave3D` (canvas/WebGL) or any animated component throws an error, the entire page will go blank with an unhandled error.
- Files: `src/App.tsx`, `src/main.tsx`
- Blocks: Production resilience.

**No SEO or meta tags:**
- Problem: `index.html` contains only a default Vite template title. No Open Graph tags, description meta, or canonical URL are present.
- Files: `index.html`
- Blocks: Discoverability and social sharing for a landing page.

## Test Coverage Gaps

**No tests whatsoever:**
- What's not tested: The entire codebase. There are no test files, no test runner configuration, and no testing libraries in `package.json`.
- Files: All of `src/`
- Risk: Regressions in animation logic, UI behavior, or any future API integration go entirely undetected. The canvas animation math in `src/components/DataWave3D.tsx` is particularly complex and untested.
- Priority: Low (marketing landing page), but any server-side code (when implemented) should have at minimum integration tests for API routes.

---

*Concerns audit: 2026-04-02*
