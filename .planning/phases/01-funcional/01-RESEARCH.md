# Phase 1: Funcional — Research

**Researched:** 2026-04-02
**Domain:** React SPA brownfield wiring — WhatsApp CTAs, canvas memory leak fix, mobile navbar, photo fallback, HTML metadata
**Confidence:** HIGH (all findings verified via direct codebase audit)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CTA-01 | Botão "Iniciar Transformação" (Hero) abre WhatsApp com mensagem pré-preenchida | Hero.tsx line 46: `<button>` with no onClick or href. Convert to `<a href={WHATSAPP_URL}>`. |
| CTA-02 | Botão "Agendar Sessão Estratégica" (FinalCTA) abre WhatsApp com mensagem pré-preenchida | FinalCTA.tsx line 44: `<button>` with no onClick or href. Convert to `<a href={WHATSAPP_URL}>`. |
| CTA-03 | Ícone WhatsApp no FinalCTA linka para WhatsApp | FinalCTA.tsx line 50: `<a href="#">`. Replace `#` with `WHATSAPP_URL`. |
| CTA-04 | Ícone Email no FinalCTA linka para email de contato | FinalCTA.tsx line 58: `<a href="#">`. Replace with `mailto:EMAIL`. |
| CTA-05 | Botão "Nossa Metodologia" (Hero) rola para #servicos | Hero.tsx line 51: `<button>` with no action. Convert to `<a href="#servicos">` or add smooth-scroll onClick. |
| CTA-07 | Todos os links centralizados em `constants/links.ts` | File does not exist. Must be created at `src/constants/links.ts`. |
| FIX-01 | index.html title corrigido de "RAI" para "RIA — Revolução da Inteligência Artificial" | index.html line 6: `<title>RAI - Revolução da Inteligência Artificial!</title>`. Direct edit. |
| FIX-02 | index.html lang corrigido de "en" para "pt-BR" | index.html line 2: `<html lang="en">`. Direct edit. |
| FIX-03 | DataWave3D armazena e cancela o ID do requestAnimationFrame no cleanup | DataWave3D.tsx line 163: `requestAnimationFrame(render)` — ID never stored. Cleanup on line 174 does not call `cancelAnimationFrame`. |
| FIX-04 | Seção About exibe foto real (raul-pedro.png) ou fallback elegante | About.tsx line 64: `<img src="/raul-pedro.png">` — no `onError` handler. File does not exist in /public. |
| NAV-01 | Navbar tem menu mobile funcional (hamburguer / drawer) | Navbar.tsx: `isOpen` state exists and toggle works. Mobile menu renders but "Falar agora" button (line 54) has no href/onClick. Functionally broken for conversion. |
| NAV-02 | Links da Navbar rolam suavemente para as seções corretas | Navbar.tsx lines 27-29: Desktop anchor links exist (`#servicos`, `#sobre`, `#contato`). Smooth scroll requires CSS `scroll-behavior: smooth` on `html` element (absent from index.css) or JS `scrollIntoView({ behavior: 'smooth' })`. Mobile links lines 51-53 also exist. |
| NAV-03 | Navbar muda de transparente para sólida ao scrollar | Navbar.tsx: No scroll listener. No conditional className for solid background. Needs `useEffect` + `useState` for scroll position tracking. |
</phase_requirements>

---

## Summary

Phase 1 is purely a **wiring phase** — the page is visually complete but functionally inert. Every conversion action leads nowhere. The research is based entirely on direct codebase inspection; no speculative library choices are required because no new dependencies are needed.

The work falls into four categories: (1) create `src/constants/links.ts` and wire all CTAs to WhatsApp using `<a>` tags, (2) fix two lines in `index.html` (title typo and lang attribute), (3) fix the `requestAnimationFrame` leak in `DataWave3D.tsx` by storing the frame ID and cancelling it on cleanup, and (4) add scroll-solid behavior to Navbar and an `onError` fallback to the About photo.

Zero new npm packages are required. All changes are code edits to existing files plus one new file.

**Primary recommendation:** Start with `src/constants/links.ts` — it unblocks all CTA wiring in one shot, then fix index.html (2 lines), then DataWave3D cleanup (3 lines), then Navbar scroll solid + mobile CTA wire, then About fallback.

---

## Standard Stack

### Core (no changes — existing stack is sufficient)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.0.0 | Component rendering | Already installed |
| TypeScript | ~5.8.2 | Type safety | Already installed |
| Vite | ^6.2.0 | Build tooling | Already installed |
| Tailwind CSS | ^4.1.14 | Styling | Already installed |
| Motion | ^12.23.24 | Animations | Already installed |
| lucide-react | ^0.546.0 | Icons | Already installed |

### New Files (no installs required)

| File | Purpose | Notes |
|------|---------|-------|
| `src/constants/links.ts` | Single source of truth for all external URLs | TypeScript module, no dependencies |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `wa.me` URL string | `react-whatsapp` library | Library adds abstraction over a URL string — unnecessary. `wa.me` is the official Meta format. |
| CSS `scroll-behavior: smooth` | `scrollIntoView({ behavior: 'smooth' })` | Both work. CSS approach is one line in `index.css`. JS approach gives more control (offset for fixed navbar). Recommend JS for NAV-02 because of 80px fixed navbar. |
| `onError` handler on `<img>` | Always serve the real photo | `onError` is the safety net. Photo will be added manually by user later. |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure (addition only)

```
src/
├── constants/
│   └── links.ts        ← NEW: WHATSAPP_URL, WHATSAPP_URL_HERO, EMAIL, LINKEDIN_URL
├── components/
│   ├── Hero.tsx         ← edit: wire CTAs
│   ├── FinalCTA.tsx     ← edit: wire CTAs + social icons
│   ├── Navbar.tsx       ← edit: scroll solid + mobile CTA wire
│   ├── DataWave3D.tsx   ← edit: rAF cleanup
│   └── About.tsx        ← edit: onError fallback
└── index.css            ← edit: add scroll-behavior or confirm JS approach
index.html               ← edit: title, lang
```

### Pattern 1: constants/links.ts — Single Source of Truth

**What:** One TypeScript module exports all external contact URLs. Every component imports from here.
**When to use:** Any time the same URL appears in more than one place. Changing the phone number = one edit.

```typescript
// src/constants/links.ts
// Source: Direct codebase audit — phone number from STATE.md

const WHATSAPP_PHONE = '5516997879837';

// Hero CTA — shorter message, first impression
export const WHATSAPP_URL_HERO = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, vi seu site e quero agendar uma sessão estratégica gratuita.'
)}`;

// Final CTA — clear booking intent
export const WHATSAPP_URL_CTA = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, quero agendar minha sessão estratégica de 30 minutos.'
)}`;

// Icon link — generic fallback
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;

// Email — TBD, placeholder mailto for now
export const EMAIL = 'contato@ria.com.br'; // UPDATE when real email is defined

// LinkedIn — placeholder until profile is created
export const LINKEDIN_URL = '#'; // UPDATE when LinkedIn profile is created
```

### Pattern 2: `<a>` Tag for External Navigation (not `<button>`)

**What:** All CTA buttons that navigate to an external URL (WhatsApp) use `<a>` elements styled as buttons.
**When to use:** Any time a "button" navigates somewhere rather than triggering a local action.

```tsx
// Source: Direct codebase audit of Hero.tsx + FinalCTA.tsx

// BEFORE (broken):
<button className="...">Iniciar Transformação</button>

// AFTER (correct):
<a
  href={WHATSAPP_URL_HERO}
  target="_blank"
  rel="noopener noreferrer"
  className="..."  // same className, no visual change
>
  Iniciar Transformação
</a>
```

**Why `<a>` and not `onClick={() => window.open(...)}` on `<button>`:**
- `<a>` supports right-click "Open in new tab" natively
- `<a>` works without JavaScript (progressive enhancement)
- `<a>` is the correct semantic element for navigation
- On iOS, `<a href="wa.me/...">` triggers the native app intent reliably; `window.open` can be blocked by popup blockers

### Pattern 3: rAF Cleanup with useRef

**What:** Store the `requestAnimationFrame` return value in a `ref` so the cleanup function can cancel it.
**When to use:** Any `useEffect` that starts a `requestAnimationFrame` loop.

```typescript
// Source: Direct audit of DataWave3D.tsx lines 47-178

// BEFORE (broken — line 163 + cleanup lines 174-177):
const render = () => {
  // ... render logic
  requestAnimationFrame(render); // ID is discarded
};
render();
return () => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
  // cancelAnimationFrame never called — loop runs forever
};

// AFTER (correct):
let frameId: number;
const render = () => {
  // ... render logic
  frameId = requestAnimationFrame(render);
};
frameId = requestAnimationFrame(render);
return () => {
  cancelAnimationFrame(frameId);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
};
```

**Note:** A `useRef` is an alternative to a `let` variable for the frame ID. Either works; `let` is simpler inside a single `useEffect`. Use `useRef` if the cancel logic needs to be accessible outside the effect.

### Pattern 4: Navbar Scroll Solid

**What:** Add a scroll event listener in Navbar's `useEffect` that sets a boolean state. Use conditional Tailwind classes to toggle background opacity.
**When to use:** Fixed navbars that need to change appearance on scroll.

```tsx
// Source: Codebase audit of Navbar.tsx — scroll listener absent

const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 50);
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// On the inner div (currently has `glass-card` class):
className={`max-w-7xl mx-auto rounded-2xl px-6 py-4 flex items-center justify-between border transition-all duration-300 ${
  scrolled
    ? 'bg-black/90 border-white/10 backdrop-blur-xl'
    : 'glass-card border-white/5'
}`}
```

### Pattern 5: About Photo with onError Fallback

**What:** Add `onError` handler to the `<img>` in About.tsx. When the image fails to load, replace with an elegant SVG initials avatar.
**When to use:** Any `<img>` pointing to a user-uploaded asset that may not exist yet.

```tsx
// Source: Direct audit of About.tsx lines 64-69

const [imgError, setImgError] = useState(false);

// Replace the <img> with:
{imgError ? (
  <div className="w-full h-full flex items-center justify-center bg-white/5">
    <span className="font-display font-bold text-white/30 text-[120px] tracking-tighter select-none">
      RP
    </span>
  </div>
) : (
  <img
    src="/raul-pedro.png"
    alt="Raul Pedro"
    className="w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
    onError={() => setImgError(true)}
    referrerPolicy="no-referrer"
  />
)}
```

### Pattern 6: Smooth Scroll with Navbar Offset

**What:** Anchor links in the Navbar need to scroll to sections accounting for the fixed navbar height (~80px).
**When to use:** Fixed navbar + anchor navigation.

```tsx
// Source: Codebase audit — Navbar has no scroll handler; HTML has no scroll-behavior

// Option A: CSS (simplest, but no offset control — section header may hide under navbar)
// In index.css:
html { scroll-behavior: smooth; }

// Option B: JS with offset (recommended — navbar is ~80px fixed)
// Replace anchor tags in Navbar with onClick handlers:
const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 80; // navbar height
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
  setIsOpen(false); // close mobile menu
};

// Usage:
<a onClick={() => scrollTo('servicos')} className="cursor-pointer ...">Serviços</a>
```

**Recommendation:** Use Option B (JS with offset). The existing Navbar.tsx already uses `onClick={() => setIsOpen(false)}` on mobile links — the pattern is consistent.

### Anti-Patterns to Avoid

- **`<button>` for external navigation:** Using `<button onClick={() => window.open(url)}>` for WhatsApp CTAs. Use `<a href={url}>` instead.
- **WhatsApp URL with `+` or spaces in the number:** `wa.me/+55 16 99787-9837` — invalid. Use pure digits: `wa.me/5516997879837`.
- **Unencoded characters in WhatsApp text param:** Portuguese characters (ã, ç, é) in the `text=` param without `encodeURIComponent()` will break on some Android browsers.
- **`requestAnimationFrame` ID discarded:** The exact bug in the current code. One line fix.
- **`api.whatsapp.com/send?phone=` format:** This is the server-side Business API URL. User-facing click-to-chat links must use `wa.me`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WhatsApp click-to-chat | Custom redirect server, QR code generator, or webhook | Native `wa.me` URL | Official Meta format, works on all platforms, zero infrastructure |
| Smooth scroll with offset | Custom easing animation loop | `window.scrollTo({ behavior: 'smooth' })` | Built into every browser since 2015 |
| Image error handling | Custom image-loading service or placeholder CDN | React `onError` state | 3 lines of code, no dependency |
| rAF cancellation | Timer-based alternatives | `cancelAnimationFrame(id)` | The correct, documented Web API |

**Key insight:** Every problem in Phase 1 has a native browser or standard React solution. No library is the correct answer for all of them.

---

## Common Pitfalls

### Pitfall 1: WhatsApp Number Format
**What goes wrong:** URL `https://wa.me/+5516997879837` or `https://wa.me/55 16 99787-9837` — the link opens but fails on some mobile clients.
**Why it happens:** `wa.me` requires pure digits with no `+`, spaces, or punctuation.
**How to avoid:** Phone constant = `'5516997879837'` — country code (55) + area code (16) + 9-digit number (997879837). Verify: `5516997879837` = 13 digits total. Brazilian mobile numbers are: 55 (country) + 2-digit DDD + 9-digit number.
**Warning signs:** Link works on desktop WhatsApp Web but fails to open app on Android.

### Pitfall 2: Pre-filled Message Too Long
**What goes wrong:** Message is > 150 characters; the user sees a long wall of text pre-filled and feels uncomfortable sending it.
**Why it happens:** Developers write copy that's persuasive for reading but creates friction for sending.
**How to avoid:** Keep pre-filled messages to one sentence, < 100 characters. The goal is to start the conversation, not close the deal in the first message.
**Warning signs:** Internal testers say "I wouldn't send this."

### Pitfall 3: rAF Leak Undetected in Development
**What goes wrong:** In React 19 Strict Mode (`<React.StrictMode>` in main.tsx), effects run twice in development. The double-mount means two render loops run simultaneously — but `cancelAnimationFrame` is never called, so both persist. The page runs at 2x CPU in dev mode only.
**Why it happens:** Strict Mode is intentional — it surfaces exactly this class of cleanup bug.
**How to avoid:** After the fix, verify in DevTools Performance that the animation loop stops when the component unmounts. The fix (store and cancel the frame ID) resolves this for both dev and production.

### Pitfall 4: Mobile Menu "Falar agora" Still Broken After Navbar Fix
**What goes wrong:** The desktop "Falar agora" button gets wired to WhatsApp, but the mobile version (Navbar.tsx line 54) is a separate `<button>` that is not updated.
**Why it happens:** The mobile menu is a duplicate of the desktop menu items, not a shared component. Easy to miss one.
**How to avoid:** Search Navbar.tsx for all `<button>` elements — there are two "Falar agora" buttons (desktop line 30, mobile line 54). Both must be converted to `<a href={WHATSAPP_URL}>`.

### Pitfall 5: Smooth Scroll Shows Section Title Behind Navbar
**What goes wrong:** Clicking a Navbar anchor link scrolls correctly, but the section heading is hidden under the 80px fixed navbar.
**Why it happens:** `href="#servicos"` scrolls the element to the very top of the viewport, not below the navbar.
**How to avoid:** Use the JS scroll function with an 80px offset (Pattern 6 above). Do NOT use `href="#servicos"` anchor links directly — replace with `onClick` handlers.

### Pitfall 6: About Photo — State Must Be in the Component
**What goes wrong:** The `imgError` state is added to About.tsx but the img/fallback conditional breaks the animation because the `motion.div` wrapper no longer has the same children between renders.
**Why it happens:** React reconciliation — changing children structure causes re-animation.
**How to avoid:** Keep the `motion.div` wrapper identical. Only swap the content inside it (the `<img>` vs the fallback `<div>`). The `motion.div` itself should not change.

---

## Code Examples

### WhatsApp URL Construction
```typescript
// src/constants/links.ts
// Phone: 5516997879837 (confirmed from STATE.md)
// Format: country code 55 + area code 16 + 9-digit mobile 997879837
const WHATSAPP_PHONE = '5516997879837';

export const WHATSAPP_URL_HERO = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, vi seu site e quero agendar uma sessão estratégica gratuita.'
)}`;

export const WHATSAPP_URL_CTA = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Olá Raul, quero agendar minha sessão estratégica de 30 minutos.'
)}`;

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;
export const EMAIL = 'contato@ria.com.br'; // placeholder — update when real email confirmed
export const LINKEDIN_URL = '#'; // placeholder — update when LinkedIn profile is created
```

### index.html Corrections (complete head block)
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RIA — Revolução da Inteligência Artificial</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Note:** Phase 1 only fixes `title` and `lang`. Meta description, OG tags, favicon are Phase 2 (SEO requirements are scoped there).

### DataWave3D rAF Fix (surgical edit)
```typescript
// Inside useEffect, replace lines 47-178 structure:
// 1. Add variable before render function definition:
let frameId: number;

// 2. Replace the final line of render() (currently line 163):
// BEFORE: requestAnimationFrame(render);
// AFTER:
frameId = requestAnimationFrame(render);

// 3. Replace the cleanup return (currently lines 174-177):
// BEFORE:
return () => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
};
// AFTER:
return () => {
  cancelAnimationFrame(frameId);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
};
```

---

## State of the Art

| Old Approach | Current Approach | Impact for This Phase |
|--------------|------------------|----------------------|
| `window.open(url)` on button click | `<a href={url} target="_blank">` | Use `<a>` — correct semantic, no popup-blocker risk |
| Per-component WhatsApp URLs | `constants/links.ts` single import | Centralized: phone change = 1 file edit |
| CSS `scroll-behavior: smooth` | JS `scrollTo({ behavior: 'smooth' })` with offset | JS required for navbar offset compensation |

---

## Open Questions

1. **Email address (CTA-04)**
   - What we know: STATE.md says "TBD (placeholder for now)"
   - What's unclear: Real email is not yet defined
   - Recommendation: Use `mailto:contato@ria.com.br` as placeholder in `constants/links.ts`. The `<a href={EMAIL}>` will resolve when the constant is updated. Document clearly as TODO.

2. **LinkedIn URL**
   - What we know: STATE.md says "placeholder, not yet created"
   - What's unclear: Profile URL unknown
   - Recommendation: Keep `LINKEDIN_URL = '#'` in constants. The FinalCTA LinkedIn icon (currently `href="#"`) stays as `href="#"` effectively, but is wired through the constant so it's a 1-line update when ready.

3. **Navbar brand logo — "RAI" typo**
   - What we know: Navbar.tsx line 18 has `<span>RAI</span>` in the logo circle
   - What's unclear: Not explicitly listed as a Phase 1 requirement (FIX-01 targets `index.html` title only)
   - Recommendation: Fix it as part of Phase 1 wiring — it's 3 characters in one line, same class of typo. Flag as implicit dependency of FIX-01 intent. The planner should decide whether to include it.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 1 is purely code/config changes. No external CLIs, databases, or services are required. All changes are edits to existing TypeScript/HTML files.

---

## Validation Architecture

No automated test infrastructure exists in this project. The validation approach is manual functional testing.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification Method |
|--------|----------|-----------|---------------------|
| CTA-01 | Hero "Iniciar Transformação" opens WhatsApp with pre-filled message | manual | Click button on desktop and mobile — WhatsApp opens with correct message |
| CTA-02 | FinalCTA "Agendar" opens WhatsApp | manual | Click button — WhatsApp opens with correct message |
| CTA-03 | FinalCTA MessageCircle icon opens WhatsApp | manual | Click icon — WhatsApp opens |
| CTA-04 | FinalCTA Mail icon opens email client | manual | Click icon — email client opens with `mailto:` |
| CTA-05 | "Nossa Metodologia" scrolls to #servicos | manual | Click button — page smoothly scrolls to Services section |
| CTA-07 | All URLs import from constants/links.ts | code review | Search codebase for hardcoded `wa.me` or `mailto:` strings — should be zero |
| FIX-01 | Browser tab shows "RIA — Revolução da Inteligência Artificial" | manual | Open browser tab, verify tab title |
| FIX-02 | HTML lang is pt-BR | code review | `curl` the built HTML or view-source — `<html lang="pt-BR">` |
| FIX-03 | Animation loop stops on unmount | manual/DevTools | DevTools Performance tab — CPU drops to ~0% when DataWave3D is not rendering |
| FIX-04 | About shows fallback when photo missing | manual | Temporarily rename /public/raul-pedro.png — verify initials "RP" fallback renders |
| NAV-01 | Mobile hamburger opens/closes menu | manual | Narrow viewport (<768px) — hamburger opens drawer, X closes it |
| NAV-02 | Navbar links scroll smoothly to correct sections | manual | Click Serviços, Sobre, Contato — smooth scroll, section not hidden under navbar |
| NAV-03 | Navbar background becomes solid on scroll | manual | Scroll past 50px — navbar background changes from glass to solid black |

### Wave 0 Gaps

No test framework is in use and none needs to be added for this phase. Validation is entirely manual functional checks. If a test framework is introduced in a future phase, these behaviors can be formalized.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase audit — `Hero.tsx`, `FinalCTA.tsx`, `Navbar.tsx`, `DataWave3D.tsx`, `About.tsx`, `index.html`, `src/index.css` (first-hand inspection, 2026-04-02)
- `.planning/STATE.md` — WhatsApp number `5516997879837` confirmed
- `.planning/REQUIREMENTS.md` — requirement IDs and descriptions
- `.planning/research/STACK.md` — existing stack versions, WhatsApp wa.me URL format
- `.planning/research/ARCHITECTURE.md` — component tree, recommended patterns
- `.planning/research/PITFALLS.md` — identified bugs mapped to specific file lines
- MDN `cancelAnimationFrame`: https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame

### Secondary (MEDIUM confidence)
- WhatsApp `wa.me` click-to-chat format: https://faq.whatsapp.com/5913398998672934 (official Meta docs — confirmed in training data)
- Brazilian phone number format (55 + 2-digit DDD + 9-digit mobile): standard telecoms format

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all changes are to existing, audited code; no new dependencies
- Architecture: HIGH — patterns are direct edits, not architectural decisions
- Pitfalls: HIGH — all critical pitfalls are verified by direct code inspection (specific line numbers cited)

**Research date:** 2026-04-02
**Valid until:** Stable — this research is tied to the specific codebase snapshot. Valid until any of the audited files change significantly.
