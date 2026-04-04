---
phase: 02-identidade-e-seo
plan: 02
subsystem: seo
tags: [seo, open-graph, twitter-card, json-ld, structured-data, favicon, canonical]
dependency_graph:
  requires: [02-01]
  provides: [SEO-01, SEO-02, SEO-03, SEO-04, SEO-05]
  affects: [index.html]
tech_stack:
  added: []
  patterns: [static-html-meta-tags, json-ld-structured-data, og-protocol, twitter-card]
key_files:
  created: []
  modified:
    - index.html
decisions:
  - "Two separate JSON-LD script blocks (LocalBusiness+Person / FAQPage) for better parser coverage"
  - "og:image uses absolute https:// URL — WhatsApp rejects relative URLs"
  - "All domain placeholders marked with TODO comments for easy swap when real domain is set"
  - "Meta description 143 chars — within 155 char limit, urgent FOMO tone per D-03"
metrics:
  duration: "3 min"
  completed_date: "2026-04-03"
  tasks_completed: 1
  files_modified: 1
requirements: [SEO-01, SEO-02, SEO-03, SEO-04, SEO-05]
---

# Phase 02 Plan 02: SEO Meta Tags + JSON-LD Summary

**One-liner:** Full SEO enrichment of index.html — OG/Twitter Card social previews, canonical, favicon, and two JSON-LD blocks (LocalBusiness+Person, FAQPage) for Google and AI Overviews.

## What Was Built

Added every static SEO tag required for discoverability and correct social sharing previews to `index.html`. WhatsApp, LinkedIn, and Google crawlers all read static HTML before JavaScript executes — this plan makes the page fully visible to them.

### Tags Added

| Tag Group | Tags |
|-----------|------|
| SEO-01 | `<meta name="description">` — 143 chars, urgent+FOMO tone |
| SEO-02 | og:type, og:locale, og:title, og:description, og:image (absolute URL), og:image:width/height, og:url, og:site_name |
| SEO-03 | twitter:card, twitter:title, twitter:description, twitter:image |
| SEO-04 | `<link rel="icon" href="/favicon.svg">` |
| SEO-05 | `<link rel="canonical" href="https://ria.com.br">` |
| JSON-LD 1 | LocalBusiness + Person (Raul Pedro) with knowsAbout array |
| JSON-LD 2 | FAQPage with 5 Q&A entries targeting key AI consulting queries |

## Test Results

```
npx vitest run tests/seo.test.ts --reporter=verbose

 ✓ SEO-01: has meta description
 ✓ SEO-02: has og:title
 ✓ SEO-02: has og:description
 ✓ SEO-02: has og:image with absolute URL
 ✓ SEO-02: has og:url
 ✓ SEO-03: has twitter:card
 ✓ SEO-04: has favicon link to /favicon.svg
 ✓ SEO-05: has canonical link
 ✓ SEO-01+02: meta description is max 155 chars

 Test Files  1 passed (1)
      Tests  9 passed (9)
```

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add SEO meta tags, OG, Twitter Card, canonical, favicon, JSON-LD | 2c5a2ab | index.html |

## Deviations from Plan

None — plan executed exactly as written.

**Deviation note:** npm install was needed before running tests (worktree missing node_modules — expected for a fresh worktree). This is infrastructure, not a plan deviation.

## Known Stubs

None. All tags are fully populated with real content. Domain placeholder `https://ria.com.br` is intentional per D-09 and marked with TODO comments.

## Self-Check: PASSED

- index.html exists and contains all required tags: FOUND
- Commit 2c5a2ab exists: FOUND
- All 9 vitest assertions GREEN: PASSED
