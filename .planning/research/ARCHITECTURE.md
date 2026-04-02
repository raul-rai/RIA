# Architecture Patterns

**Domain:** React/Vite SPA landing page — AI consulting conversion
**Researched:** 2026-04-02
**Confidence:** MEDIUM (WebSearch unavailable; based on codebase audit + established patterns for this stack)

---

## Existing Architecture (Audit)

The codebase already has a clear structural shape. This document describes what exists, what gaps need filling, and the recommended patterns to close those gaps.

### Current Component Tree

```
App
├── DataWave3D          (fixed, z-0 — canvas background, scroll-driven)
├── Navbar              (fixed, z-50 — glass card, mobile toggle state)
└── main (z-10)
    ├── Hero            (section — motion.div entrance animations, 2 CTAs)
    ├── Services        (section — service cards)
    ├── WhyNow          (section — 3 market stats)
    ├── TheChoice       (section — two-column scenario cards)
    ├── About           (section — founder bio)
    └── FinalCTA        (section — primary CTA + social links)
    └── Footer          (z-10 — copyright + social icons)
```

### Z-Index Layer Model (existing, correct)

| Layer | z-index | Occupant |
|-------|---------|----------|
| Canvas background | 0 | DataWave3D (fixed, pointer-events: none) |
| Page content | 10 | `<main>` + Footer |
| Navbar | 50 | Navbar (fixed) |
| Hero internal | 30 | Hero content div |

This layering is sound. No changes recommended.

### What Is Missing (Active Requirements)

| Gap | Location | Pattern to Apply |
|-----|----------|-----------------|
| WhatsApp href on all CTA buttons | Hero, Navbar, FinalCTA, Footer | Shared `WHATSAPP_URL` constant |
| SEO meta tags | `index.html` | Static tags in `<head>` (see below) |
| Canvas mobile optimization | DataWave3D | `prefers-reduced-motion` + device pixel ratio branch |
| Tailwind token organization | `src/index.css` | Grouped `@theme` block with comments |
| Mobile menu CTA wired | Navbar | Same WhatsApp href as other CTAs |

---

## Recommended Architecture

### 1. SEO Meta Tags — Static `index.html` (not react-helmet-async)

**Recommendation: put all meta tags directly in `index.html`, not via a runtime library.**

Rationale: This is a single-page, single-route site. There is no need for per-route meta tag management. `react-helmet-async` adds ~7 KB gzipped and a React context provider for a problem that does not exist here. `vite-plugin-html` adds build-time templating that is only useful when injecting env variables into meta tags — not needed here either.

The correct approach for this project is:

```html
<!-- index.html <head> -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Primary SEO -->
<title>RIA — Revolução da Inteligência Artificial | Consultoria em IA</title>
<meta name="description" content="A IA é um tsunami. Empresas que não se adaptarem serão engolidas. Agende uma sessão estratégica gratuita de 30 minutos com Raul Pedro." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://[domain]/" />

<!-- Open Graph (WhatsApp + LinkedIn previews) -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://[domain]/" />
<meta property="og:title" content="A Inteligência Artificial não é uma onda. É um TSUNAMI." />
<meta property="og:description" content="Empresas que não se adaptarem serão engolidas. Construímos a prancha para você dominar essa força. Sessão estratégica gratuita." />
<meta property="og:image" content="https://[domain]/og-image.png" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:site_name" content="RIA — Revolução da Inteligência Artificial" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="A Inteligência Artificial não é uma onda. É um TSUNAMI." />
<meta name="twitter:description" content="Empresas que não se adaptarem serão engolidas. Sessão estratégica gratuita." />
<meta name="twitter:image" content="https://[domain]/og-image.png" />

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" href="/favicon.png" />
```

The OG image (`og-image.png`) should be a 1200×630px static PNG placed in `/public`. WhatsApp reads `og:image`, `og:title`, and `og:description` — these three are the minimum for a rich preview when sharing the URL.

**Confidence: HIGH** — This is established Vite SPA convention. No library needed for a single-page site.

---

### 2. WhatsApp CTA — Shared Constant + `<a>` Tag Pattern

**Recommendation: one `constants/links.ts` file, all CTAs are `<a>` tags pointing to the same URL.**

The WhatsApp deep link format for pre-filled messages is:

```
https://wa.me/[countrycode][number]?text=[url-encoded-message]
```

Example for a Brazilian number:
```
https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20sess%C3%A3o%20estrat%C3%A9gica%20gratuita.
```

The correct architectural pattern is a single source of truth:

```
src/
  constants/
    links.ts        ← WHATSAPP_URL, LINKEDIN_URL, EMAIL string exports
```

Every CTA button becomes `<a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">` — not a `<button>`. Using `<a>` is semantically correct (it navigates to an external URL), improves accessibility, and works without JavaScript.

**Locations that need this wiring:**
- `Hero.tsx` — "Iniciar Transformação" button (×1)
- `Navbar.tsx` — "Falar agora" button, desktop + mobile (×2)
- `FinalCTA.tsx` — "Agendar Sessão Estratégica" button + MessageCircle icon (×2)
- `Footer.tsx` — MessageCircle icon (×1)

**Confidence: HIGH** — Standard wa.me URL scheme, documented by WhatsApp.

---

### 3. Canvas Animation — Mobile Optimization Pattern

**Recommendation: two branches inside `DataWave3D.useEffect` — reduced-motion check first, then device capability branch.**

The animation loop currently runs unconditionally. The fix is a two-gate approach:

**Gate 1: `prefers-reduced-motion`**

```typescript
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) {
  // render a single static frame, then return — no requestAnimationFrame loop
}
```

Users who have opted into reduced motion on their OS get a static snapshot of the wave. This is both accessibility-correct and eliminates battery drain for a significant segment of mobile users.

**Gate 2: Device performance branch**

Detect mobile via viewport width or `navigator.maxTouchPoints` and apply a lower-resolution grid:

```typescript
const isMobile = window.innerWidth < 768;
const cols = isMobile ? 30 : 60;   // half resolution on mobile
const rows = isMobile ? 22 : 45;   // ~half the rows
const spacing = isMobile ? 100 : 90; // slightly wider spacing to maintain coverage
```

This reduces the point count from 2,700 to ~660 on mobile — an ~75% reduction in per-frame computation with negligible visual difference on a small screen.

**Gate 3: Canvas resolution (devicePixelRatio)**

The current resize handler sets `canvas.width = window.innerWidth`. On a 3x Retina mobile screen this renders at 3× the pixel count, tripling GPU memory usage.

```typescript
// Cap device pixel ratio at 1.5 for canvas — visual difference is negligible
const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
canvas.width = width * dpr;
canvas.height = height * dpr;
ctx.scale(dpr, dpr);
```

**Confidence: HIGH** — `prefers-reduced-motion` is a W3C media query with universal browser support. DPR capping is a standard canvas optimization pattern.

---

### 4. Tailwind CSS v4 Token Organization

**Recommendation: organize `src/index.css` with the `@theme` block grouped by semantic category, with comments.**

Tailwind v4 uses CSS-native `@theme` blocks — there is no `tailwind.config.js`. The current `index.css` is functional but grows unmanageable without grouping. The recommended structure:

```css
@import "tailwindcss";

@theme {
  /* === Typography === */
  --font-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-display: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* === Background Colors === */
  --color-bg-base: #000000;
  --color-bg-alt: #050505;
  --color-bg-card: #0A0A0A;

  /* === Brand Colors === */
  --color-primary: #ffffff;
  --color-accent: #00E5FF;
  --color-cta: #2a42ec;    /* the blue used in "É UM TSUNAMI." headline */

  /* === Text Colors === */
  --color-muted: #888888;

  /* === Spacing Scale (if custom values needed) === */
  /* --spacing-section: 8rem; */
}
```

The key addition is `--color-cta: #2a42ec` — the electric blue used inline in `Hero.tsx` as a hardcoded `style` or class `text-[#2a42ec]`. Moving it to a token means it's available as `text-cta` and can be changed from one place.

**Confidence: HIGH** — Tailwind v4 `@theme` is the official token API.

---

## Component Boundaries

| Component | Single Responsibility | Receives | Emits |
|-----------|----------------------|----------|-------|
| `DataWave3D` | Canvas animation, scroll tracking | — (pure side-effect) | — |
| `Navbar` | Navigation + mobile menu state | — | scroll anchor navigation |
| `Hero` | First-screen CTA + headline | — | WhatsApp navigation (via `<a>`) |
| `Services` | Service cards list | — | — |
| `WhyNow` | Market statistics display | — | — |
| `TheChoice` | Two-column contrast narrative | — | — |
| `About` | Founder bio + credentials | — | — |
| `FinalCTA` | Primary conversion CTA | — | WhatsApp navigation (via `<a>`) |
| `Footer` | Legal + social links | — | WhatsApp / LinkedIn / Email navigation |
| `constants/links.ts` | URL constants | — | imported by Navbar, Hero, FinalCTA, Footer |

**Data flow direction:** Unidirectional, no shared state needed. No props passed between sections. All components are independently rendered leaf nodes. The only cross-cutting concern is the `WHATSAPP_URL` constant — resolved by a shared import, not React context or prop drilling.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: WhatsApp URL Scattered as String Literals

**What:** Hardcoding `https://wa.me/...` in every button component separately.
**Why bad:** When the phone number or pre-filled message changes, you must edit 6+ locations and risk inconsistency.
**Instead:** Single `constants/links.ts` export, imported everywhere.

---

### Anti-Pattern 2: react-helmet-async for a Single-Route SPA

**What:** Installing `react-helmet-async`, wrapping App in `<HelmetProvider>`, and using `<Helmet>` components to inject meta tags.
**Why bad:** Runtime DOM manipulation for meta that never changes. Adds bundle weight (~7 KB), adds a React context, and crawlers relying on static HTML may not see the tags before JS executes (Googlebot does render JS, but WhatsApp link previews do not — they only parse static HTML).
**Instead:** Static meta tags in `index.html`.

---

### Anti-Pattern 3: Rendering Canvas at Native Device Pixel Ratio on Mobile

**What:** `canvas.width = window.innerWidth` with no DPR scaling on a 3x screen.
**Why bad:** Renders at 3× the pixel count (e.g., 1170px → 3510px wide), tripling memory usage and raster computation per frame on a constrained mobile GPU.
**Instead:** Cap DPR at 1.5 for canvas elements. Visual difference at canvas scale is imperceptible.

---

### Anti-Pattern 4: `<button>` for External Navigation

**What:** Using `<button onClick={() => window.open(url)}>` for the WhatsApp CTAs.
**Why bad:** Breaks right-click "open in new tab", fails keyboard navigation in some flows, incorrect semantic element.
**Instead:** `<a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">` styled as button.

---

### Anti-Pattern 5: Hardcoded Color Values in Component JSX

**What:** `text-[#2a42ec]` inline in `Hero.tsx`.
**Why bad:** Not discoverable from the design system. If the brand color shifts, you search the JSX rather than the theme file.
**Instead:** `--color-cta` token in `@theme`, used as `text-cta`.

---

## Build Order for This Milestone

The active requirements map to this implementation order, based on dependency and risk:

**Step 1 — Foundation (no risk, unblocks everything)**
- Create `src/constants/links.ts` with `WHATSAPP_URL`, `LINKEDIN_URL`, `EMAIL`
- Wire all CTA buttons/icons in Hero, Navbar, FinalCTA, Footer to use these constants
- This is zero-risk, pure wiring — do it first so all CTAs are live

**Step 2 — SEO (no risk, pure HTML edits)**
- Add all meta tags to `index.html`
- Create `/public/og-image.png` (1200×630)
- Add favicon files to `/public`
- No JS changes, no component changes

**Step 3 — Tailwind token cleanup**
- Add `--color-cta: #2a42ec` to `@theme`
- Replace `text-[#2a42ec]` in Hero.tsx with `text-cta`
- Group existing tokens with comments
- Low risk, improves maintainability going forward

**Step 4 — Canvas mobile optimization (most complex, do last)**
- Add `prefers-reduced-motion` gate
- Add mobile grid resolution branch (cols/rows conditional)
- Add DPR cap in resize + init handlers
- Test on real mobile device — visual regression risk is low but non-zero

---

## Scalability Notes

This is intentionally a permanent single-page site. Scalability concerns are minimal:

| Concern | Current approach | Notes |
|---------|-----------------|-------|
| Adding more sections | Drop new component into App.tsx `<main>` | No routing needed |
| Changing WhatsApp number | Edit one line in `constants/links.ts` | Resolved by Step 1 above |
| A/B testing CTAs | Would require split at App level | Out of scope for this version |
| i18n (PT/EN) | Not in scope | Would need library if added |
| Analytics / conversion tracking | UTM params on WhatsApp URL | Append `&utm_source=site` to wa.me URL |

---

## Sources

- Codebase audit: `src/App.tsx`, `src/components/*.tsx`, `src/index.css`, `vite.config.ts`, `package.json`, `index.html`
- WhatsApp wa.me link format: documented at https://faq.whatsapp.com/425247423114725 (MEDIUM confidence — based on training data, verified pattern)
- Tailwind v4 `@theme` API: `@tailwindcss/vite ^4.1.14` in package.json confirms v4; `@theme` block already in use in `index.css` (HIGH confidence — observed in codebase)
- `prefers-reduced-motion` media query: W3C Media Queries Level 5 (HIGH confidence — established standard)
- Canvas DPR optimization: standard pattern, widely documented (MEDIUM confidence — training data only, no live verification)
- SEO static vs runtime: single-route SPA argument (HIGH confidence — architectural reasoning)

**Note:** WebSearch was unavailable during this research session. All findings are based on codebase audit and training data up to August 2025. The patterns documented here are well-established and low-risk, but the canvas mobile optimization section should be validated with real device testing.
