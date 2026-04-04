---
phase: 02-identidade-e-seo
plan: 03
subsystem: brand-tokens
tags: [tailwind, css-tokens, favicon, svg, brand]
dependency_graph:
  requires: [02-01]
  provides: [--color-cta token, favicon.svg]
  affects: [src/index.css, public/favicon.svg]
tech_stack:
  added: []
  patterns: [Tailwind v4 CSS-first token via @theme, static SVG favicon]
key_files:
  modified: [src/index.css]
  created: [public/favicon.svg]
decisions:
  - "D-15: --color-cta: #2a42ec added to @theme — single source of truth for CTA blue"
  - "D-13: favicon.svg uses RIA text on #2a42ec background, 64x64 viewBox, rx=12 corners"
  - "D-14: SVG-only favicon, no multi-size — modern browsers accept SVG natively"
metrics:
  duration: "~1 min"
  completed: "2026-04-03"
  tasks_completed: 2
  files_changed: 2
---

# Phase 02 Plan 03: Design Token + Favicon Summary

**One-liner:** CTA blue #2a42ec registered as Tailwind v4 @theme token generating bg-cta/text-cta/border-cta utilities, plus static SVG favicon with RIA brand mark.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add --color-cta token to @theme in index.css | e0d7260 | src/index.css |
| 2 | Create public/favicon.svg | d8c644d | public/favicon.svg |

## What Was Built

**Task 1 — Design Token**
Added `--color-cta: #2a42ec;` inside the existing `@theme` block in `src/index.css`, after `--color-muted`. This registers the CTA blue as a Tailwind v4 design token, automatically generating utility classes `bg-cta`, `text-cta`, `border-cta`, `ring-cta`, `from-cta`, `to-cta` available project-wide. The color was previously hardcoded in Hero.tsx as `text-[#2a42ec]` — the token is now the canonical source.

**Task 2 — Favicon**
Created `public/favicon.svg` (306 bytes) — a 64×64 SVG with:
- Blue rounded rect (`fill="#2a42ec"`, `rx="12"`)
- White "RIA" text centered (`font-size="28"`, `text-anchor="middle"`, `y="44"`)
- Helvetica Neue font stack (web-safe, no external dependency)

The `<link rel="icon">` reference in index.html is added by Plan 02.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both deliverables are complete and functional. The favicon will display once Plan 02 adds the `<link rel="icon" href="/favicon.svg">` tag to index.html.

## Self-Check: PASSED

- FOUND: src/index.css (contains --color-cta: #2a42ec)
- FOUND: public/favicon.svg (306 bytes, valid SVG)
- FOUND commit e0d7260: feat(02-03): add --color-cta token
- FOUND commit d8c644d: feat(02-03): create public/favicon.svg
