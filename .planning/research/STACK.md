# Technology Stack — Completion Research

**Project:** RIA — Revolução da Inteligência Artificial (landing page)
**Researched:** 2026-04-02
**Overall confidence:** HIGH (for established APIs and patterns) / MEDIUM (for library version specifics without live verification)
**Research mode:** Ecosystem — what's needed to COMPLETE an existing brownfield React+Vite SPA

---

## Context: What Already Exists

The core stack is locked and working. Do NOT change or add to these:

| Technology | Version | Status |
|---|---|---|
| React | ^19.0.0 | Active, all components |
| TypeScript | ~5.8.2 | Active, all source files |
| Vite | ^6.2.0 | Active, dev + build |
| Tailwind CSS | ^4.1.14 | Active, CSS-first config |
| Motion (Framer Motion) | ^12.23.24 | Active, all animated sections |
| lucide-react | ^0.546.0 | Active, all icon usage |

This document covers only what needs to be ADDED to reach production readiness.

---

## Gap Analysis: What Is Missing

Derived from direct codebase inspection:

1. **WhatsApp CTA links** — All CTA buttons and social links use `href="#"` placeholder. No WhatsApp URL, no pre-filled message.
2. **SEO / Open Graph** — `index.html` has only a default Vite title. No `<meta name="description">`, no OG tags, no favicon.
3. **Canvas performance** — DataWave3D runs at full display refresh rate (up to 120Hz) on all devices including low-end mobile with no throttle or resolution scaling.
4. **Profile image** — `/raul-pedro.png` referenced in About.tsx but missing from `public/`.
5. **Error boundary** — No React error boundary; a canvas crash blanks the entire page.
6. **rAF cleanup** — DataWave3D never cancels its `requestAnimationFrame` loop on unmount.

---

## Recommended Additions

### 1. WhatsApp CTA Integration

**Approach: Native `wa.me` URL — no library needed.**

WhatsApp provides a universal click-to-chat URL format that opens a pre-filled message in any WhatsApp client (web or mobile):

```
https://wa.me/<PHONE_NUMBER>?text=<URL_ENCODED_MESSAGE>
```

- `<PHONE_NUMBER>` is the international format without `+`, spaces, or dashes. For Brazil: country code `55` + DDD + number. Example: `5511999998888`.
- `<URL_ENCODED_MESSAGE>` is the pre-filled text encoded with `encodeURIComponent()`.

**Example for this project:**

```typescript
const WHATSAPP_PHONE = '5511999998888'; // replace with Raul's real number
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá Raul! Vi o site da RIA e quero agendar minha sessão estratégica gratuita de 30 minutos.'
);
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${WHATSAPP_MESSAGE}`;
```

All CTA buttons should become `<a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">` rather than `<button>`. This is critical for mobile — anchor tags trigger native app intent; buttons do not.

**Why no library:** Libraries like `react-whatsapp` exist but add unnecessary abstraction over a simple URL string. The `wa.me` format is the official, documented API from Meta. It works universally — mobile (app deep link), desktop (WhatsApp Web), and Brazilian feature phones.

**Confidence:** HIGH — `wa.me` is the official Meta-documented format, stable since 2017, and the correct approach for 2025/2026.

**Source:** https://faq.whatsapp.com/5913398998672934 (WhatsApp official click-to-chat docs)

---

### 2. SEO — Meta Tags and Open Graph

**Approach: Direct `index.html` static tags — no library needed.**

For a single-page, single-route landing page (no React Router, no dynamic routes), static meta tags in `index.html` are superior to runtime injection libraries. Crawlers and link previewer bots (WhatsApp, LinkedIn, Telegram) read raw HTML before JavaScript executes. A SPA that injects meta tags via React will fail to generate correct previews in many environments.

**Do NOT use `react-helmet-async`** for this project. It injects tags at runtime via JavaScript — this means:
- Link previews on WhatsApp and LinkedIn will use the fallback (empty) tags from the raw HTML, not the injected ones
- Adds ~13KB to the bundle for zero benefit on a single-route SPA
- Creates a flash where the page title is wrong before hydration

**Correct approach — static tags in `index.html`:**

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary SEO -->
  <title>RIA — Consultoria de IA para Empresas | Raul Pedro</title>
  <meta name="description" content="A IA é um tsunami. Empresas que não se adaptarem serão engolidas. Agende uma sessão estratégica gratuita de 30 minutos com Raul Pedro e domine essa força antes da concorrência." />
  <meta name="author" content="Raul Pedro" />
  <link rel="canonical" href="https://riaconsultoria.com.br" />

  <!-- Open Graph (WhatsApp, LinkedIn, Facebook, Telegram) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://riaconsultoria.com.br" />
  <meta property="og:title" content="RIA — A IA é um Tsunami. Você está pronto?" />
  <meta property="og:description" content="Consultoria de IA para empresários brasileiros. Sessão estratégica gratuita de 30 minutos." />
  <meta property="og:image" content="https://riaconsultoria.com.br/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:site_name" content="RIA — Revolução da Inteligência Artificial" />

  <!-- Twitter Card (also used by some Brazilian platforms) -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="RIA — A IA é um Tsunami. Você está pronto?" />
  <meta name="twitter:description" content="Consultoria de IA para empresários brasileiros. Sessão estratégica gratuita de 30 minutos." />
  <meta name="twitter:image" content="https://riaconsultoria.com.br/og-image.png" />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</head>
```

**OG image requirements:**
- Dimensions: 1200x630px (standard for all major platforms)
- Format: PNG preferred (no transparency issues)
- File location: `public/og-image.png`
- Content: Brand name + headline + visual identity — design once, static asset
- File size: Keep under 300KB; WhatsApp has a known 300KB limit for preview generation

**Confidence:** HIGH — OG spec is stable, `index.html` static approach is the correct solution for single-route SPAs, WhatsApp's 300KB limit is well-documented community knowledge (MEDIUM confidence on exact limit).

---

### 3. Favicon and Brand Identity

**Approach: Multi-format favicon set in `public/`.**

Minimum required files:

| File | Size | Format | Purpose |
|---|---|---|---|
| `favicon.svg` | vector | SVG | Modern browsers (Chrome 87+, Firefox 84+) |
| `favicon.png` | 32x32 | PNG | Fallback for older browsers |
| `apple-touch-icon.png` | 180x180 | PNG | iOS home screen / Safari |
| `og-image.png` | 1200x630 | PNG | Social sharing preview |

**Why SVG first:** An SVG favicon supports dark mode via `prefers-color-scheme` media query inside the SVG, scales perfectly at any size, and is a single file vs. a full icon set. For a dark-themed brand like RIA, this matters — the favicon needs to be visible on both light and dark browser chrome.

**Tool recommendation for creation:**
- Design in Figma (free) or directly in a text editor for simple geometric logos
- Use `realfavicongenerator.net` to generate the full set from a single master image

**No npm package needed** — favicon files are static assets dropped into `public/`.

**Confidence:** HIGH — file format support is well-established browser behavior.

---

### 4. Canvas Performance Optimization

**Approach: Pure JavaScript changes to DataWave3D.tsx — no new libraries.**

The existing concerns audit identified three performance issues. Solutions are all in-code, no external dependency needed:

**Issue 1: No rAF cancellation on unmount (also a memory leak)**

```typescript
// Inside useEffect, before render():
let frameId: number;

// Inside render(), replace the final line:
frameId = requestAnimationFrame(render);

// In the cleanup return:
return () => {
  cancelAnimationFrame(frameId);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
};
```

**Issue 2: Runs at full refresh rate (up to 120Hz) with no throttle**

Add a timestamp-based frame rate cap to 60fps:

```typescript
let lastTime = 0;
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

const render = (timestamp: number) => {
  if (timestamp - lastTime < FRAME_INTERVAL) {
    frameId = requestAnimationFrame(render);
    return;
  }
  lastTime = timestamp;
  // ... rest of render logic
};

frameId = requestAnimationFrame(render);
```

**Issue 3: Same grid resolution on all devices (mobile performance)**

Detect mobile at initialization and reduce grid:

```typescript
const isMobile = window.innerWidth < 768;
const cols = isMobile ? 30 : 60;
const rows = isMobile ? 22 : 45;
```

This reduces draw calls from ~2,600 to ~650 on mobile — a 4x reduction in CPU load.

**OffscreenCanvas / Web Worker approach — DEFER:**
Moving the canvas render loop to a Web Worker via `OffscreenCanvas` is the advanced optimization path. It moves CPU-intensive work off the main thread entirely, eliminating jank from scroll and animation contention. However:
- `OffscreenCanvas` requires significant architectural refactoring of DataWave3D (the scroll listener must use `postMessage` to communicate with the worker)
- Browser support is now universal (Chrome 69+, Firefox 105+, Safari 16.4+) — confidence HIGH on support
- Complexity cost is high for a landing page; the mobile grid reduction + fps cap should be sufficient for this use case

**Recommendation:** Implement rAF fix + fps cap + mobile grid reduction. Defer OffscreenCanvas to v2 unless profiling shows main thread blocking on mid-range Android devices.

**Confidence:** HIGH for rAF fix and fps throttle (standard patterns). MEDIUM for mobile breakpoint grid values (30/22 is an estimate — should be tested on real devices).

---

### 5. Error Boundary for Canvas Resilience

**Approach: Custom React error boundary class component — no library needed.**

React does not have a hooks-based error boundary API as of React 19. A class component is required:

```typescript
// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
```

Wrap DataWave3D in App.tsx:

```tsx
<ErrorBoundary fallback={<div className="fixed inset-0 bg-black" />}>
  <DataWave3D />
</ErrorBoundary>
```

If the canvas throws (WebGL context lost, out-of-memory on low-end mobile), the page continues rendering with a black background instead of going blank.

**Confidence:** HIGH — this is standard React 19 API, no library needed.

---

### 6. Analytics — Optional but Recommended

**Approach: Cloudflare Web Analytics (if hosted on Cloudflare) or Umami self-hosted — no cookies, LGPD-compliant.**

The Brazilian LGPD (Lei Geral de Proteção de Dados) is analogous to GDPR. Using Google Analytics on a Brazilian-targeted site without a cookie consent banner creates legal exposure. Cookie-free analytics avoids this entirely.

**Recommended options (in order of preference):**

| Option | Bundle impact | Privacy | Cost | Setup |
|---|---|---|---|---|
| Cloudflare Web Analytics | Zero (CDN-injected script) | Cookie-free, no PII | Free | One script tag in `index.html` |
| Umami (self-hosted) | ~2KB async script | Cookie-free, your data | Free (self-host) | One script tag in `index.html` |
| Plausible | ~1KB async script | Cookie-free, EU-hosted | $9/mo | One script tag in `index.html` |
| Google Analytics 4 | ~28KB | Requires LGPD consent banner | Free | Complex setup + cookie banner |

**Recommendation:** If the site is deployed on Cloudflare Pages (which it should be, see deployment below), use Cloudflare Web Analytics — zero performance cost, zero privacy risk, LGPD-safe, free.

All three cookie-free options require only a single `<script>` tag in `index.html` — no npm package, no React integration needed.

**Confidence:** MEDIUM — LGPD compliance details require legal verification. The technical privacy claims of cookie-free analytics are HIGH confidence based on product documentation.

---

### 7. Production Deployment

**Recommendation: Cloudflare Pages.**

The existing stack (`vite build` producing a `dist/` static output) is a perfect fit for Cloudflare Pages:

- Free tier: unlimited requests, unlimited bandwidth, 500 builds/month
- Global CDN: edge caching in Brazil (São Paulo PoP) reduces TTFB for the target audience
- Automatic HTTPS: no certificate management
- Deploy from GitHub: push to `main` triggers build automatically
- `_redirects` file support: unnecessary for a SPA with no routing, but available

**Alternative: Vercel** — equally capable, slightly more complex free tier limits. Either is fine.

**Why not current setup (Google AI Studio / Cloud Run):** The `.planning/codebase/STACK.md` notes the project was inferred to be targeting Google AI Studio. For a public-facing marketing landing page, Cloud Run adds operational overhead (container management, cold starts, billing) that a static CDN deployment eliminates entirely.

**Confidence:** MEDIUM — deployment target is inferred from codebase, not explicitly stated. Either Cloudflare Pages or Vercel is correct for this type of project.

---

## What NOT to Add

| Library | Why Not |
|---|---|
| `react-helmet-async` | Runtime injection fails for WhatsApp/LinkedIn link previews which parse raw HTML before JS runs. Static `index.html` tags are correct for single-route SPA. |
| `react-whatsapp` | Unnecessary abstraction over a URL string. `wa.me` is the official API. |
| Google Analytics | Requires LGPD consent banner — adds complexity and degrades UX. Use cookie-free alternative instead. |
| `OffscreenCanvas` / Web Worker for canvas | Correct long-term optimization but over-engineered for current requirements. Simple fps cap + mobile grid reduction achieves the goal. |
| React Router | Out of scope per PROJECT.md — single-page, anchor navigation only. |
| Any form library (React Hook Form, Formik) | No form needed — WhatsApp is the conversion channel. |
| Any backend/API additions | Out of scope per PROJECT.md — no server-side capture this phase. |

---

## Installation

No new packages are required for the core missing features (WhatsApp CTAs, SEO, favicon, error boundary, canvas fixes). All are implemented through:

1. Static `index.html` edits (meta tags, favicon references, analytics script tag)
2. Static file additions to `public/` (favicon files, OG image, profile photo)
3. TypeScript/TSX code changes to existing components (WhatsApp URLs, error boundary, canvas fixes)

If Cloudflare Web Analytics is chosen for analytics, one `<script>` tag is added to `index.html` — no npm install.

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| WhatsApp `wa.me` URL format | HIGH | Official Meta documentation, stable since 2017 |
| Static meta tags in `index.html` for OG | HIGH | Standard practice, verified by SPA SEO constraints |
| OG image 1200x630px requirement | HIGH | Stated in OG spec, universally supported |
| WhatsApp 300KB OG image limit | MEDIUM | Community-documented but not in official WhatsApp spec |
| rAF cancellation pattern | HIGH | Standard React cleanup pattern, documented |
| fps throttle via timestamp delta | HIGH | Well-established animation pattern |
| Mobile grid resolution values (30/22) | MEDIUM | Estimate — needs device testing to confirm adequate visual quality |
| OffscreenCanvas browser support | HIGH | MDN-documented, Chrome 69+, Firefox 105+, Safari 16.4+ |
| LGPD compliance via cookie-free analytics | MEDIUM | Technical claims are sound; legal compliance requires counsel |
| Cloudflare Pages as deployment target | MEDIUM | Inferred from project type, not explicitly specified by owner |

---

## Sources

- WhatsApp Click-to-Chat official docs: https://faq.whatsapp.com/5913398998672934
- Open Graph Protocol spec: https://ogp.me/
- MDN OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- MDN cancelAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame
- Vite Build Guide: https://vitejs.dev/guide/build.html
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/
- LGPD (Lei 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

*Note: Web search and WebFetch tools were unavailable during this research session. All findings are based on training knowledge (cutoff August 2025) and direct codebase inspection. Confidence levels reflect this. Version numbers for existing packages are taken directly from the project's `package.json` — no npm registry verification was performed.*
