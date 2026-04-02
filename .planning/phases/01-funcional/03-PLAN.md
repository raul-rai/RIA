---
phase: 01-funcional
plan: 03
type: execute
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - src/components/Navbar.tsx
  - src/components/About.tsx
autonomous: true
requirements:
  - NAV-01
  - NAV-02
  - NAV-03
  - FIX-04

must_haves:
  truths:
    - "Mobile hamburger menu opens and closes correctly at viewport < 768px"
    - "Both desktop and mobile 'Falar agora' buttons open WhatsApp"
    - "Navbar anchor links scroll smoothly to sections with no heading hidden under the navbar"
    - "Navbar background transitions from glass to solid black after scrolling 50px"
    - "Navbar logo circle reads 'RIA' not 'RAI'"
    - "About section shows initials 'RP' fallback when raul-pedro.png does not exist"
  artifacts:
    - path: "src/components/Navbar.tsx"
      provides: "Mobile menu, scroll-solid background, smooth nav links, wired WhatsApp button"
      contains: "scrolled"
    - path: "src/components/About.tsx"
      provides: "Photo with onError fallback"
      contains: "imgError"
  key_links:
    - from: "Navbar scroll listener"
      to: "scrolled state"
      via: "useEffect + window.addEventListener('scroll')"
      pattern: "setScrolled"
    - from: "Navbar nav links"
      to: "page sections"
      via: "onClick scrollTo with 80px offset"
      pattern: "scrollTo.*behavior.*smooth"
    - from: "src/components/About.tsx img"
      to: "imgError state"
      via: "onError={() => setImgError(true)}"
      pattern: "onError"
---

<objective>
Make the Navbar fully functional (scroll solid, smooth navigation, mobile WhatsApp CTA) and add a graceful fallback to the About photo.

Purpose: NAV-01/02/03 are the remaining conversion-critical features — mobile users need the "Falar agora" button to actually open WhatsApp. FIX-04 prevents a broken image from damaging credibility until the real photo is uploaded. Runs in parallel with Plan 02 (no shared files).
Output: Navbar.tsx with scroll solid + smooth nav + wired CTAs. About.tsx with onError fallback.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-funcional/01-RESEARCH.md
@.planning/phases/01-funcional/01-01-SUMMARY.md

<!-- Interface contracts from Plan 01 (src/constants/links.ts) -->
<interfaces>
From src/constants/links.ts (created in Plan 01):

```typescript
export const WHATSAPP_URL: string;  // https://wa.me/5516997879837 (no pre-filled text)
```

This is the only constant needed by Navbar — the "Falar agora" button is a general entry point.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Upgrade Navbar — scroll solid, smooth nav, wired CTAs, logo fix</name>
  <files>src/components/Navbar.tsx</files>

  <read_first>
    - src/components/Navbar.tsx (full file — current state: no scroll listener, no scrollTo handler, two unwired "Falar agora" buttons at lines 30 and 54, logo "RAI" typo at line 18)
    - src/constants/links.ts (verify WHATSAPP_URL export)
    - .planning/phases/01-funcional/01-RESEARCH.md (Pattern 4 — Navbar scroll solid, Pattern 6 — smooth scroll with offset)
  </read_first>

  <action>
Rewrite Navbar.tsx with the following changes. The overall structure (motion.nav wrapper, desktop menu, mobile toggle, mobile drawer) must remain identical — only add new state, new imports, and replace specific elements.

**Change 1 — Add imports:**
Add `useEffect` to the existing React import. Add the WHATSAPP_URL import from constants:

```typescript
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WHATSAPP_URL } from '../constants/links';
```

**Change 2 — Add scrolled state inside the component (after the existing isOpen state):**
```typescript
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 50);
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**Change 3 — Add scrollTo helper function inside the component (after the useEffect):**
```typescript
const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: 'smooth' });
  setIsOpen(false);
};
```

**Change 4 — Update the inner nav div className to toggle on scroll:**
The `<div>` on line 15 currently has `className="max-w-7xl mx-auto glass-card rounded-2xl px-6 py-4 flex items-center justify-between border border-white/5"`.

Replace with a dynamic className using the `scrolled` state:
```tsx
<div className={`max-w-7xl mx-auto rounded-2xl px-6 py-4 flex items-center justify-between border transition-all duration-300 ${
  scrolled
    ? 'bg-black/90 border-white/10 backdrop-blur-xl'
    : 'glass-card border-white/5'
}`}>
```

**Change 5 — Fix logo typo:**
Line 18: change `<span className="font-display font-bold text-sm text-black">RAI</span>` to `<span className="font-display font-bold text-sm text-black">RIA</span>`

**Change 6 — Desktop anchor links — replace href with onClick scrollTo:**
The three desktop `<a>` tags (lines 27-29) currently use `href="#servicos"`, `href="#sobre"`, `href="#contato"`. Replace each with an onClick handler. Keep all existing className values:

```tsx
<a onClick={() => scrollTo('servicos')} className="cursor-pointer text-sm text-muted hover:text-white transition-colors">Serviços</a>
<a onClick={() => scrollTo('sobre')} className="cursor-pointer text-sm text-muted hover:text-white transition-colors">Sobre</a>
<a onClick={() => scrollTo('contato')} className="cursor-pointer text-sm text-muted hover:text-white transition-colors">Contato</a>
```

**Change 7 — Desktop "Falar agora" button (currently line 30):**
Replace `<button>` with `<a>`:
```tsx
<a
  href={WHATSAPP_URL}
  target="_blank"
  rel="noopener noreferrer"
  className="px-6 py-2.5 rounded-full border border-white/20 text-sm font-medium text-white hover:bg-white hover:text-black transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
>
  Falar agora
</a>
```

**Change 8 — Mobile anchor links (lines 51-53) — replace href with onClick scrollTo:**
Keep existing `onClick={() => setIsOpen(false)}` on each and ADD the scrollTo call. Replace with:
```tsx
<a onClick={() => scrollTo('servicos')} className="cursor-pointer text-base text-muted hover:text-white transition-colors">Serviços</a>
<a onClick={() => scrollTo('sobre')} className="cursor-pointer text-base text-muted hover:text-white transition-colors">Sobre</a>
<a onClick={() => scrollTo('contato')} className="cursor-pointer text-base text-muted hover:text-white transition-colors">Contato</a>
```
Note: scrollTo() already calls setIsOpen(false) internally — no need for separate onClick.

**Change 9 — Mobile "Falar agora" button (currently line 54):**
Replace `<button>` with `<a>`:
```tsx
<a
  href={WHATSAPP_URL}
  target="_blank"
  rel="noopener noreferrer"
  className="w-full px-6 py-3 mt-2 rounded-full bg-white text-black text-sm font-medium transition-colors text-center block"
>
  Falar agora
</a>
```

Do not change: motion.nav props, initial/animate/transition animations, the hamburger toggle button, or the mobile drawer's motion.div animation props.
  </action>

  <verify>
    <automated>cd "C:/Users/raulp/OneDrive/Área de Trabalho/Projetos/RIA" && npm run lint 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - grep "useEffect" src/components/Navbar.tsx returns a match
    - grep "scrolled" src/components/Navbar.tsx returns at least 3 matches (state declaration, setter, className usage)
    - grep "setScrolled" src/components/Navbar.tsx returns a match (inside scroll listener)
    - grep "scrollTo" src/components/Navbar.tsx returns at least 5 matches (helper + 6 usage calls)
    - grep "window.scrollY - 80" src/components/Navbar.tsx returns a match
    - grep "WHATSAPP_URL" src/components/Navbar.tsx returns at least 3 matches (import + 2 usages)
    - grep "Falar agora" src/components/Navbar.tsx returns 2 matches (desktop + mobile) — both as anchor tags
    - grep ">RAI<" src/components/Navbar.tsx returns no match (logo typo fixed)
    - grep ">RIA<" src/components/Navbar.tsx returns a match (logo corrected)
    - grep 'href="#servicos"' src/components/Navbar.tsx returns no match (replaced with onClick)
    - grep 'href="#sobre"' src/components/Navbar.tsx returns no match
    - grep 'href="#contato"' src/components/Navbar.tsx returns no match
    - npm run lint passes with no errors on this file
  </acceptance_criteria>

  <done>Navbar has scroll-solid background (scrolled state), smooth scroll with 80px offset via scrollTo helper, both "Falar agora" buttons wired to WHATSAPP_URL, all nav links use onClick scrollTo, logo reads "RIA". Lint passes.</done>
</task>

<task type="auto">
  <name>Task 2: About photo onError fallback</name>
  <files>src/components/About.tsx</files>

  <read_first>
    - src/components/About.tsx (full file — img at lines 64-69, motion.div wrapper at lines 54-75)
    - .planning/phases/01-funcional/01-RESEARCH.md (Pattern 5 — About photo with onError fallback, Pitfall 6 — keep motion.div wrapper unchanged)
  </read_first>

  <action>
Make the following changes to src/components/About.tsx:

**Change 1 — Add useState to the existing import:**
```typescript
import { useRef, useState } from 'react';
```
(useInView is already imported from motion/react separately — do not touch that import)

**Change 2 — Add imgError state inside the component (after the existing ref/isInView declarations):**
```typescript
const [imgError, setImgError] = useState(false);
```

**Change 3 — Replace the `<img>` element (currently lines 64-69) with a conditional:**
The `<motion.div>` wrapper that contains the image (lines 54-75) must NOT change — keep all its props (initial, animate, transition, className) identical. Only replace the content inside it.

Find the `<img>` tag inside the motion.div:
```tsx
{/* Avatar - The user should upload their image to the public folder as raul-pedro.png */}
<img
  src="/raul-pedro.png"
  alt="Raul Pedro"
  className="w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
  referrerPolicy="no-referrer"
/>
```

Replace with:
```tsx
{/* Avatar — shows real photo when available, RP initials fallback when missing */}
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

Do not change: the motion.div wrapper props, the gradient overlays (lines 60-61), the name/title block at the bottom (lines 71-74), or the text content section.

Critical: the conditional must be placed INSIDE the motion.div, not replacing it. The motion.div itself must remain as the wrapper.
  </action>

  <verify>
    <automated>cd "C:/Users/raulp/OneDrive/Área de Trabalho/Projetos/RIA" && npm run lint 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - grep "useState" src/components/About.tsx returns a match
    - grep "imgError" src/components/About.tsx returns at least 3 matches (declaration, setter, conditional)
    - grep "onError" src/components/About.tsx returns a match
    - grep "setImgError(true)" src/components/About.tsx returns a match
    - grep ">RP<" src/components/About.tsx returns a match (fallback initials text)
    - grep "text-\[120px\]" src/components/About.tsx returns a match (fallback typography)
    - npm run lint passes with no errors on this file
    - npm run build succeeds
  </acceptance_criteria>

  <done>About.tsx has imgError state, onError handler on the img sets imgError=true, and when imgError is true renders an elegant "RP" initials fallback inside the same motion.div wrapper. Lint and build pass.</done>
</task>

</tasks>

<verification>
After both tasks:
- npm run build exits 0 with no TypeScript errors
- Navbar: scroll listener, scrollTo helper, both "Falar agora" as anchors, logo "RIA", nav links via onClick
- About: onError fallback present, motion.div wrapper unchanged
- Manual test checklist (run in browser):
  1. Resize viewport to < 768px, click hamburger — mobile drawer opens
  2. Click "Falar agora" in mobile drawer — WhatsApp opens
  3. Click any nav link (Serviços/Sobre/Contato) — smooth scroll with no heading hidden under navbar
  4. Scroll past 50px — navbar background transitions from glass to solid black
  5. In About section, if raul-pedro.png missing — "RP" initials show instead of broken image
</verification>

<success_criteria>
- npm run build exits 0
- NAV-01: mobile menu opens/closes via hamburger toggle
- NAV-02: nav links smooth-scroll to correct sections with 80px offset
- NAV-03: navbar background is solid bg-black/90 after scrolling 50px
- FIX-04: About shows "RP" fallback when /public/raul-pedro.png does not exist
- Both "Falar agora" buttons (desktop and mobile) open WhatsApp
</success_criteria>

<output>
After completion, create .planning/phases/01-funcional/01-03-SUMMARY.md with:
- Files modified
- Confirmation of each NAV requirement satisfied
- Confirmation of FIX-04 fallback implemented
- Note: raul-pedro.png must be manually added to /public by user when available
</output>
