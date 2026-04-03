---
phase: 02-identidade-e-seo
plan: 01
subsystem: test-infrastructure
tags: [vitest, sharp, tdd, seo, brand, wave-0]
dependency_graph:
  requires: []
  provides: [test-infrastructure, seo-test-stubs, brand-test-stubs]
  affects: [02-02, 02-03, 02-04]
tech_stack:
  added: [vitest@^4.1.2, sharp@^0.34.5]
  patterns: [TDD red-phase, fs-based static file assertions]
key_files:
  created:
    - vitest.config.ts
    - tests/seo.test.ts
    - tests/brand.test.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Node environment (no jsdom) — tests read static files via fs, no browser APIs needed"
  - "Tests written intentionally RED — Wave 1 plans implement features to turn them GREEN"
metrics:
  duration: 2 min
  completed: 2026-04-03T20:31:55Z
  tasks_completed: 3
  tasks_total: 3
  files_changed: 5
---

# Phase 02 Plan 01: Test Infrastructure (Wave 0) Summary

Vitest + sharp installed and failing test stubs written for all SEO and brand deliverables in Wave 0 RED state.

## What Was Built

- **vitest ^4.1.2** and **sharp ^0.34.5** installed as devDependencies
- **`npm test` script** (`vitest run`) added to package.json
- **vitest.config.ts** with `environment: 'node'`, `include: ['tests/**/*.test.ts']`
- **tests/seo.test.ts** — 9 assertions covering SEO-01 through SEO-05 (meta description, all OG tags, twitter:card, favicon, canonical)
- **tests/brand.test.ts** — 3 assertions covering BRAND-01 (--color-cta token) and BRAND-02 (og-image.png exists and < 300KB)

## Test Results (Expected RED State)

```
Test Files  2 failed (2)
Tests  10 failed | 2 passed (12)
Duration  846ms
```

All 10 substantive tests fail against current index.html/index.css — correct Wave 0 RED state. Wave 1 plans (02-02, 02-03, 02-04) will implement features to turn them GREEN.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 - Install vitest + sharp | 31a1058 | chore(02-01): install vitest and sharp, add test script |
| 2 - vitest.config.ts | dc46824 | chore(02-01): create vitest.config.ts with node environment |
| 3 - Test stubs | f0566ba | test(02-01): add failing test stubs for SEO and brand assertions |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — this plan creates test infrastructure only, no UI or data stubs.

## Self-Check: PASSED
