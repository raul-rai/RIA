# Project Research Summary

**Project:** RIA — Revolução da Inteligência Artificial (landing page)
**Domain:** Brazilian B2B AI consulting landing page — WhatsApp conversion funnel, single-route React SPA
**Researched:** 2026-04-02
**Confidence:** HIGH (for code-verified gaps and standard patterns) / MEDIUM (for conversion and deployment decisions)

## Executive Summary

RIA is a visually complete but functionally broken landing page. The existing React 19 + TypeScript + Vite + Tailwind v4 + Motion stack is solid and requires no changes. All work needed to reach production is gap-closing, not new construction: wiring conversion actions that already exist visually, adding missing static assets, hardening a canvas animation for mobile, and adding SEO metadata that was never set up. The page currently has zero functional CTAs — every button is a no-op, every social link goes to `#`. Until this is fixed, the site cannot generate a single lead regardless of traffic.

The recommended approach is to close gaps in strict dependency order: CTA wiring first (unblocks conversion immediately), then SEO/assets (unblocks shareability), then canvas performance (unblocks quality on mid-range Android, which is ~40% of the Brazilian mobile market). No new libraries are required for any of these. All solutions are pure HTML edits, static asset additions, and small TypeScript changes to existing components. The total implementation effort is low.

The key risk is mobile performance on budget Android devices. The DataWave3D canvas renders 2,700 points per frame at full refresh rate with no throttle, no DPR cap, and no `cancelAnimationFrame` on unmount — a combination that will cause visible lag and battery drain on the devices most common among Brazilian SMB owners. A 4-step mitigation (rAF cleanup, FPS cap, mobile grid reduction, DPR cap) resolves this without any new dependencies. A secondary risk is SEO: the current `index.html` has a brand name typo ("RAI" not "RIA"), `lang="en"` on a Portuguese page, and no Open Graph tags — meaning any link shared on WhatsApp will render a blank preview, directly undermining the WhatsApp-first funnel.

---

## Key Findings

### Recommended Stack

The existing stack is locked and no additions are required. See `STACK.md` for the complete gap analysis and solution patterns.

**Core technologies (existing — do not change):**
- React 19 + TypeScript 5.8: component layer, all sections are independent leaf nodes
- Vite 6.2: build tooling, static output to `dist/` — perfectly suited for CDN deployment
- Tailwind CSS v4 (CSS-first `@theme` config): design tokens, layout, no `tailwind.config.js`
- Motion (Framer Motion) v12: entrance animations on Hero and section components
- lucide-react: all icon usage site-wide

**Additions needed (no new npm packages):**
- `src/constants/links.ts`: single source of truth for WHATSAPP_URL, LINKEDIN_URL, EMAIL — import in all CTA components
- Static meta tags in `index.html`: title, description, og:title, og:description, og:image, canonical, lang fix
- Static assets in `public/`: favicon.svg, favicon.png, apple-touch-icon.png, og-image.png (1200x630), raul-pedro.png
- `src/components/ErrorBoundary.tsx`: class component wrapping DataWave3D to prevent canvas crash from blanking the page

**Deployment recommendation:** Cloudflare Pages (free, global CDN with Brazilian PoP, automatic HTTPS, GitHub push-to-deploy). No container management overhead.

### Expected Features

The page already has all the sections it needs. The work is wiring existing elements and fixing missing assets — not adding new sections. See `FEATURES.md` for the complete prioritized feature list.

**Must have (table stakes — all currently missing or broken):**
- WhatsApp CTA wired with pre-filled message — without this, zero leads can be generated
- Functional navigation (Navbar anchor links, mobile hamburger menu)
- Real consultant photo at `/public/raul-pedro.png` — missing photo destroys credibility in a high-trust category
- SEO meta tags (title, description, og:image, og:description) — required for WhatsApp link previews
- Favicon — missing signals an unfinished product
- Contact info in footer wired to real URLs (WhatsApp, LinkedIn, Email)

**Should have (high-leverage differentiators, all low complexity):**
- Pre-filled WhatsApp messages per service card (each card sends context about which service the visitor is interested in)
- Sticky floating WhatsApp FAB button (appears at 30% scroll depth — captures visitors who read the page without clicking section CTAs)
- One concrete result number in the About section copy (e.g., "R$X em leads qualificados automatizados")
- LinkedIn URL visible in the About section
- Urgency micro-copy under FinalCTA ("Apenas X vagas" or "Respondo em até 2h")

**Defer to v2:**
- Social proof section with client logos or case results (requires real client data)
- Blog/content section
- Analytics integration
- OffscreenCanvas/Web Worker for canvas rendering

**Anti-features (explicitly do not build):**
- Contact form, Calendly widget, chat widget, pricing table, newsletter signup — all add friction or require backend work contrary to the WhatsApp-first strategy

### Architecture Approach

The architecture is a flat, unidirectional single-page SPA. All sections are independent leaf nodes with no shared state and no props passed between them. The only cross-cutting concern is the WhatsApp URL constant, resolved via a shared import — no React context or prop drilling needed. The z-index layer model (canvas at z-0, page content at z-10, navbar at z-50) is correct and should not change. See `ARCHITECTURE.md` for the complete build order and anti-patterns.

**Major components and their roles:**
1. `DataWave3D` — fixed canvas background, scroll-driven animation; needs mobile performance fixes
2. `Navbar` — fixed glass card nav; needs mobile menu fix and anchor scroll links
3. `Hero`, `Services`, `WhyNow`, `TheChoice`, `About`, `FinalCTA`, `Footer` — content sections; need CTA wiring
4. `constants/links.ts` (to create) — WHATSAPP_URL, LINKEDIN_URL, EMAIL constants; imported by all CTA components
5. `ErrorBoundary` (to create) — wraps DataWave3D to prevent canvas crashes from blanking the page

**Key patterns:**
- All CTA buttons become `<a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">` — semantically correct, works without JavaScript, triggers native app intent on mobile
- SEO meta tags go in static `index.html`, not via `react-helmet-async` — WhatsApp/LinkedIn link preview bots parse raw HTML before JS executes
- Canvas cleanup uses a `useRef<number>` to store rAF ID, cancelled in `useEffect` return

### Critical Pitfalls

1. **Dead CTA buttons (Pitfall 4)** — every primary action on the page is currently a no-op. Fix by converting `<button>` elements to `<a href={WHATSAPP_URL}>` tags. Must be resolved before any production deployment or promotion.

2. **Canvas animation loop never cancels (Pitfall 1)** — `DataWave3D` never calls `cancelAnimationFrame`, causing the render loop to continue after unmount and when the tab is backgrounded. Results in continuous battery drain and CPU usage. Fix: store rAF ID in a `useRef`, cancel in `useEffect` cleanup.

3. **Zero SEO + title typo (Pitfall 3)** — `index.html` has `lang="en"` (wrong language targeting), a brand name typo ("RAI" vs "RIA"), and no Open Graph tags. Sharing the URL on WhatsApp generates a blank preview card. Fix: static meta block in `index.html` before any promotion.

4. **Canvas performance collapse on low-end Android (Pitfall 5)** — 2,596 draw operations per frame at 60fps on Snapdragon 400/600 devices (common in Brazilian market) causes 5-15fps rendering. Fix: fps cap at 60, mobile grid reduction (2,700 → 660 quads), DPR cap at 1.5, `{ alpha: false }` on canvas context.

5. **Missing profile photo with no fallback (Pitfall 6)** — `About.tsx` references `/public/raul-pedro.png` which does not exist. Browser renders a broken image icon inside the styled frame, immediately undermining consultant credibility. Fix: upload real photo before deploy; add `onError` fallback handler for resilience.

---

## Implications for Roadmap

Based on combined research, four phases are recommended, ordered by dependency and conversion impact.

### Phase 1: CTA Wiring and Navigation

**Rationale:** Zero leads can be generated until CTAs work. This is the highest-leverage work on the entire project — it unblocks conversion immediately and has zero risk (pure wiring, no visual changes). All other phases improve the page; this phase makes it functional.
**Delivers:** A page where every button and social link reaches a real destination. Visitors can contact Raul from any section.
**Addresses:** All "must have" table stakes features — WhatsApp CTAs, navigation links, mobile menu, footer contact links, "Nossa Metodologia" scroll anchor.
**Avoids:** Pitfall 4 (dead CTA buttons), anti-pattern of `<button>` for external navigation.
**No research needed:** Patterns are well-documented (`wa.me` URL format, anchor scroll behavior, `<a>` vs `<button>` semantics).

### Phase 2: SEO, Assets, and Brand Identity

**Rationale:** Once CTAs work, the page needs to be shareable. Every link shared on WhatsApp (the primary distribution channel for this audience) currently generates a blank preview. This phase makes the page look professional and credible when shared, and fixes the `lang` attribute and title typo that hurt Portuguese search ranking.
**Delivers:** Rich link previews on WhatsApp, LinkedIn, and Telegram; correct browser favicon; real consultant photo; correct brand name in page title and meta.
**Addresses:** SEO meta tags, favicon, OG image, profile photo, `lang="pt-BR"` fix, title typo fix.
**Avoids:** Pitfall 3 (zero SEO / wrong language), Pitfall 6 (missing profile photo).
**Assets required from client:** Real headshot (raul-pedro.png), real WhatsApp number, real LinkedIn URL. These must be collected before this phase can close.

### Phase 3: Canvas Performance and Resilience

**Rationale:** The visual centerpiece of the page (DataWave3D) has multiple correctness and performance bugs. These are silent on desktop but visible on mid-range Android (the dominant device type in the Brazilian market). This phase ensures the animation does not drain battery, does not crash the page, and renders acceptably on budget devices.
**Delivers:** Canvas animation that cancels on unmount, caps at 60fps, uses half-resolution grid on mobile, caps DPR at 1.5, and degrades gracefully via an ErrorBoundary fallback if it crashes.
**Addresses:** rAF cleanup, fps throttle, mobile grid reduction, DPR scaling, `{ alpha: false }` context option, ErrorBoundary wrapper.
**Avoids:** Pitfall 1 (rAF loop never cancels), Pitfall 2 (canvas DPR not scaled), Pitfall 5 (performance collapse on low-end Android).
**Note:** Mobile grid values (30 cols / 22 rows) are estimates — real device testing is required to confirm adequate visual quality at reduced resolution.

### Phase 4: Conversion Optimization

**Rationale:** With CTAs wired, assets in place, and performance hardened, attention turns to increasing conversion rate. This phase adds the differentiators identified in FEATURES.md that have high conversion value at low engineering cost.
**Delivers:** Floating WhatsApp FAB button (captures visitors who read past the main CTA), per-service pre-filled messages (qualifies intent before conversation), urgency micro-copy, LinkedIn credentialing in About section, Tailwind token cleanup for ongoing maintainability.
**Addresses:** Floating FAB, per-service CTA variants, urgency copywriting, LinkedIn profile link, Tailwind `--color-cta` token, `text-[#2a42ec]` replaced with token.
**Avoids:** UX pitfalls: "no visible contact on mobile hero", "unsubstantiated copy claims", "trust reducers buried in prose".
**Defer from this phase:** Social proof section (requires real client data from Raul), analytics integration, OffscreenCanvas.

### Phase Ordering Rationale

- Phase 1 before Phase 2: CTAs must work before sharing the page — there is no point in generating rich WhatsApp previews if clicking the button does nothing.
- Phase 2 before Phase 3: The page should be professionally presentable before optimizing its performance edge cases. SEO and assets are also required for any live user testing that would reveal canvas issues on real devices.
- Phase 3 before Phase 4: Canvas bugs are correctness issues (battery drain, crashes) not UX enhancements. They should be fixed before layering on conversion improvements.
- Phase 4 last: Differentiators improve a working page; they don't fix a broken one.

### Research Flags

Phases with standard patterns (no additional research needed):
- **Phase 1 (CTA Wiring):** `wa.me` URL format, anchor scrolling, and `<a>` tag semantics are all well-established. The only blocking dependency is collecting Raul's real phone number.
- **Phase 2 (SEO/Assets):** Static meta tag format and OG spec are stable and fully documented. Asset production (photo, OG image, favicon) is design work, not research.
- **Phase 3 (Canvas):** rAF cleanup, fps throttle, and DPR patterns are standard. Mobile grid values need device testing, not additional research.
- **Phase 4 (Conversion):** FAB pattern and WhatsApp pre-fill message strategy are well-documented for the Brazilian market.

Phases that may benefit from targeted research during planning:
- **Phase 3 — mobile device testing:** If profiling on real budget Android devices shows the grid reduction is insufficient, an OffscreenCanvas/Web Worker approach may be needed. That path requires additional research before implementation.
- **Phase 4 — analytics decision:** If Cloudflare Pages is chosen for hosting, Cloudflare Web Analytics is the default. If another host is chosen, a brief research spike on LGPD-compliant options (Plausible, Umami) is warranted before implementation.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack is locked and verified by codebase audit. No additions required for core features. Deployment recommendation (Cloudflare Pages) is MEDIUM — inferred from project type, not specified by owner. |
| Features | HIGH | Feature list is derived from direct codebase audit (what exists, what is broken, what is missing). CRO recommendations for Brazilian WhatsApp-first conversion are MEDIUM — training knowledge, not live-search verified. |
| Architecture | HIGH | Component structure and anti-patterns are verified by codebase audit. All recommended patterns (static meta tags, `<a>` for CTAs, shared constants file) are well-established. Canvas optimization values (30/22 grid, 1.5 DPR cap) are MEDIUM — require device testing to confirm. |
| Pitfalls | HIGH | Code-verified pitfalls (dead CTAs, missing rAF cleanup, missing profile photo, title typo, wrong `lang`) are HIGH confidence. Performance collapse on low-end Android is MEDIUM — directionally correct, exact thresholds need profiling. |

**Overall confidence:** HIGH for correctness of all identified gaps and solutions. MEDIUM for numeric optimization values and market-specific conversion claims.

### Gaps to Address

- **Raul's real WhatsApp number:** Must be collected before Phase 1 can be completed. No wiring work is possible without it.
- **Real LinkedIn URL:** Required for Phase 1 (footer links) and Phase 4 (About section credentialing).
- **Profile photo (raul-pedro.png):** Must be provided by Raul before Phase 2 closes.
- **OG image design decision:** Use the real headshot at 1200x630, or create a branded graphic? Raul must decide. Both are valid; the headshot approach is faster.
- **Production domain:** All canonical and og:url meta tags use `https://[domain]/` as placeholder. The real domain must be set before deploy.
- **Canvas mobile grid values (30/22):** Estimates that should be confirmed with real device testing (Chrome DevTools 6x CPU throttle as a proxy, or a physical Snapdragon 400/600 device).
- **Analytics tool selection:** Deferred to v2 per FEATURES.md recommendation, but the decision should be made before Phase 2 closes (if analytics is desired, the script tag goes in `index.html` along with the other head edits).

---

## Sources

### Primary (HIGH confidence)
- Codebase audit: `src/App.tsx`, `src/components/*.tsx`, `src/index.css`, `index.html`, `package.json`, `vite.config.ts` — direct first-hand analysis
- WhatsApp Click-to-Chat official docs: https://faq.whatsapp.com/5913398998672934
- Open Graph Protocol spec: https://ogp.me/
- MDN Canvas API — Optimizing Canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- MDN cancelAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame
- W3C `prefers-reduced-motion` media query: W3C Media Queries Level 5
- Vite Build Guide: https://vitejs.dev/guide/build.html

### Secondary (MEDIUM confidence)
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/ — deployment recommendation
- LGPD (Lei 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm — compliance context for analytics choice
- Brazilian mobile market device profile — Snapdragon 400/600 series prevalence in budget segment; training knowledge as of 2024 data

### Tertiary (LOW confidence / needs validation)
- WhatsApp 300KB OG image size limit — community-documented, not in official WhatsApp spec; verify empirically after deploy
- LGPD compliance claims for cookie-free analytics — technical privacy claims are sound; legal compliance requires counsel

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
