---
phase: 01-funcional
plan: 02
subsystem: conversion
tags: [cta, whatsapp, hero, finalcta, anchor-tags, smooth-scroll]
dependency_graph:
  requires: [src/constants/links.ts]
  provides: [src/components/Hero.tsx, src/components/FinalCTA.tsx]
  affects: []
tech_stack:
  added: []
  patterns: [anchor-tag-external-nav, smooth-scroll-with-offset, constants-import]
key_files:
  created: []
  modified:
    - src/components/Hero.tsx
    - src/components/FinalCTA.tsx
decisions:
  - "LINKEDIN_URL anchor omits target='_blank' because the URL is still '#' — avoids opening empty tab on placeholder"
  - "Mail icon uses template literal href={`mailto:${EMAIL}`} — keeps EMAIL constant as the single source of truth"
  - "Nossa Metodologia uses inline onClick handler with 80px offset to clear the fixed navbar"
metrics:
  duration: "~6 minutes"
  completed: "2026-04-03"
  tasks_completed: 2
  files_changed: 2
---

# Phase 01 Plan 02: Wire Hero and FinalCTA CTAs Summary

**One-liner:** Replaced all href="#" placeholders in Hero and FinalCTA with live WhatsApp deep links, email mailto, and smooth-scroll — every conversion point is now functional.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire Hero CTAs | 82fe5d6 | src/components/Hero.tsx |
| 2 | Wire FinalCTA CTAs and social icons | 47159ed | src/components/FinalCTA.tsx |

## Files Modified

### src/components/Hero.tsx

Changes made:
- Added `import { WHATSAPP_URL_HERO } from '../constants/links'`
- Replaced `<button>` "Iniciar Transformação" with `<a href={WHATSAPP_URL_HERO} target="_blank" rel="noopener noreferrer">` — all className and children unchanged
- Added `onClick` handler to "Nossa Metodologia" button: smooth scroll to `#servicos` using `getBoundingClientRect().top + window.scrollY - 80` with `behavior: 'smooth'`

Constants imported: `WHATSAPP_URL_HERO`

### src/components/FinalCTA.tsx

Changes made:
- Added `import { WHATSAPP_URL_CTA, WHATSAPP_URL, EMAIL, LINKEDIN_URL } from '../constants/links'`
- Replaced `<button>` "Agendar Sessão Estratégica" with `<a href={WHATSAPP_URL_CTA} target="_blank" rel="noopener noreferrer">` — all className and children unchanged
- Wired MessageCircle icon: `href={WHATSAPP_URL}` with `target="_blank" rel="noopener noreferrer"`
- Wired Linkedin icon: `href={LINKEDIN_URL}` (no target="_blank" since URL is placeholder '#')
- Wired Mail icon: `href={\`mailto:${EMAIL}\`}`

Constants imported: `WHATSAPP_URL_CTA`, `WHATSAPP_URL`, `EMAIL`, `LINKEDIN_URL`

## Confirmation: All href="#" Replaced

- `grep 'href="#"' src/components/Hero.tsx` — no match (PASS)
- `grep 'href="#"' src/components/FinalCTA.tsx` — no match (PASS)
- Zero hardcoded `wa.me` or `mailto:` strings in component files — all come through constants

## Verification

- `npm run lint` (tsc --noEmit): passed with no errors
- `npm run build`: passed, bundle built in 6.48s

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `LINKEDIN_URL = '#'` in FinalCTA — intentional placeholder per STATE.md decision, LinkedIn profile not yet created. Linked to future update in constants/links.ts.

These stubs do not prevent this plan's goal: all conversion CTAs are wired and functional (WhatsApp, email). LinkedIn is the only placeholder remaining.

## Self-Check: PASSED

- src/components/Hero.tsx — FOUND
- src/components/FinalCTA.tsx — FOUND
- Commit 82fe5d6 — FOUND
- Commit 47159ed — FOUND
