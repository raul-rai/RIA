---
phase: 01-funcional
plan: 01
subsystem: foundation
tags: [constants, html-metadata, canvas, memory-leak, whatsapp]
dependency_graph:
  requires: []
  provides: [src/constants/links.ts]
  affects: [src/components/Hero.tsx, src/components/FinalCTA.tsx, src/components/Navbar.tsx]
tech_stack:
  added: []
  patterns: [named-exports-constants, cancelAnimationFrame-cleanup]
key_files:
  created:
    - src/constants/links.ts
  modified:
    - index.html
    - src/components/DataWave3D.tsx
decisions:
  - "constants/links.ts uses encodeURIComponent template literals for WhatsApp URLs — safe for all locales"
  - "EMAIL and LINKEDIN_URL use placeholder values with TODO comments per STATE.md decisions"
  - "DataWave3D cleanup: cancelAnimationFrame added before removeEventListener to stop loop before unbinding"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-02"
  tasks_completed: 3
  files_changed: 3
---

# Phase 01 Plan 01: Foundation — Constants, HTML Metadata, rAF Cleanup Summary

**One-liner:** Centralized WhatsApp/contact constants in links.ts, fixed RAI->RIA title with em dash and lang pt-BR, cancelled rAF loop on DataWave3D unmount to eliminate memory leak.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/constants/links.ts | 66b9ce3 | src/constants/links.ts (created) |
| 2 | Fix index.html title and lang | b3ddf4a | index.html |
| 3 | Fix DataWave3D rAF memory leak | 60ad4b8 | src/components/DataWave3D.tsx |

## Files Created

### src/constants/links.ts
Single source of truth for all external contact URLs. Exports:
- `WHATSAPP_URL_HERO` — Hero CTA with pre-filled message "Olá Raul, vi seu site e quero agendar uma sessão estratégica gratuita."
- `WHATSAPP_URL_CTA` — FinalCTA with pre-filled message "Olá Raul, quero agendar minha sessão estratégica de 30 minutos."
- `WHATSAPP_URL` — Generic WhatsApp entry point, no pre-filled text
- `EMAIL` — `contato@ria.com.br` (placeholder, TODO update when confirmed)
- `LINKEDIN_URL` — `#` (placeholder, TODO update when profile is created)

Phone: `5516997879837` (pure digits, no + or spaces).

## Files Modified

### index.html
- `lang="en"` corrected to `lang="pt-BR"`
- Title `RAI - Revolução da Inteligência Artificial!` corrected to `RIA — Revolução da Inteligência Artificial` (em dash U+2014, no exclamation mark, correct acronym)

### src/components/DataWave3D.tsx
- Added `let frameId: number;` before the render function declaration
- Changed `requestAnimationFrame(render)` inside render body to `frameId = requestAnimationFrame(render)`
- Changed direct `render()` initial call to `frameId = requestAnimationFrame(render)`
- Added `cancelAnimationFrame(frameId)` as first line of cleanup return function

## Verification

- `npm run lint` (tsc --noEmit): passed with no errors
- `npm run build`: passed, bundle built in 4.66s

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `EMAIL = 'contato@ria.com.br'` — placeholder, real email not yet confirmed (noted in constants file with TODO)
- `LINKEDIN_URL = '#'` — placeholder, LinkedIn profile not yet created (noted in constants file with TODO)

These are intentional per STATE.md decisions and do not prevent this plan's goal (providing the constants foundation for Plans 02 and 03).
