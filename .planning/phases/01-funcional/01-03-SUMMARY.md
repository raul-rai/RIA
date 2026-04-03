---
phase: 01-funcional
plan: 03
subsystem: navbar-about
tags: [navbar, scroll, whatsapp, mobile, about, fallback]
dependency_graph:
  requires: [01-01-SUMMARY.md]
  provides: [Navbar functional, About fallback]
  affects: [src/components/Navbar.tsx, src/components/About.tsx]
tech_stack:
  added: []
  patterns: [scroll listener with passive event, smooth scroll with offset, onError fallback]
key_files:
  created: []
  modified:
    - src/components/Navbar.tsx
    - src/components/About.tsx
decisions:
  - Inline RP text in span to satisfy grep pattern >RP< in acceptance criteria
metrics:
  duration: 8 min
  completed: 2026-04-03
  tasks_completed: 2
  files_modified: 2
---

# Phase 01 Plan 03: Navbar Functional + About Photo Fallback Summary

**One-liner:** Navbar upgraded with scroll-solid background, smooth anchored navigation (80px offset), both WhatsApp CTAs wired, logo typo fixed (RAI→RIA); About photo gains onError RP initials fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Upgrade Navbar — scroll solid, smooth nav, wired CTAs, logo fix | cdfb4c1 | src/components/Navbar.tsx |
| 2 | About photo onError fallback | 9be5ed6 | src/components/About.tsx |

## Requirements Satisfied

- **NAV-01:** Mobile hamburger menu opens/closes via `isOpen` state toggle — hamburger button remains, mobile drawer uses `motion.div` animation
- **NAV-02:** Nav links (`Serviços`, `Sobre`, `Contato`) use `onClick={() => scrollTo('id')}` with 80px offset smooth scroll — no more hash href links
- **NAV-03:** `scrolled` state activates after `window.scrollY > 50`, switching navbar inner div from `glass-card border-white/5` to `bg-black/90 border-white/10 backdrop-blur-xl`
- **FIX-04:** About section renders `RP` initials inside a `bg-white/5` div when `imgError` is true; `onError={() => setImgError(true)}` triggers on broken image load

## WhatsApp CTAs Wired

Both "Falar agora" buttons (desktop + mobile) are now `<a>` elements with `href={WHATSAPP_URL}`, `target="_blank"`, and `rel="noopener noreferrer"`. They use the generic `WHATSAPP_URL` export from `src/constants/links.ts` (no pre-filled text — general navbar entry point).

## Logo Fix

Logo circle text corrected from `RAI` to `RIA` (line 43 in updated file).

## Build & Lint

- `npm run lint` (tsc --noEmit): passes with no errors
- `npm run build`: exits 0, produces dist/ successfully (350KB JS, 43KB CSS)

## Known Stubs

- `raul-pedro.png` does not yet exist in `/public`. The About photo fallback handles this gracefully by showing `RP` initials. The real photo must be manually added by the user to `/public/raul-pedro.png` when available.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Inlined RP text for grep pattern match**
- **Found during:** Task 2 verification
- **Issue:** The plan's code example put `RP` on its own line inside `<span>`, but the acceptance criterion `grep ">RP<"` requires inline text
- **Fix:** Changed `<span ...>\n  RP\n</span>` to `<span ...>RP</span>` (inline)
- **Files modified:** src/components/About.tsx
- **Commit:** 9be5ed6

## Self-Check: PASSED

- FOUND: src/components/Navbar.tsx
- FOUND: src/components/About.tsx
- FOUND: commit cdfb4c1 (Navbar upgrade)
- FOUND: commit 9be5ed6 (About fallback)
- npm run lint: PASSED
- npm run build: PASSED (exits 0)
