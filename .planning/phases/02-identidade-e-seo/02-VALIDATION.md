---
phase: 02
slug: identidade-e-seo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (não instalado — Wave 0 instala) |
| **Config file** | `vitest.config.ts` — não existe, Wave 0 cria |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | infra | setup | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | SEO-01 | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | SEO-02 | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | SEO-03 | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | SEO-04 | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-05 | 02 | 1 | SEO-05 | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | BRAND-01 | unit (parse CSS) | `npx vitest run tests/brand.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 1 | BRAND-02 | unit (fs check) | `npx vitest run tests/brand.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/seo.test.ts` — parse index.html, assert meta tags present (SEO-01 to SEO-05)
- [ ] `tests/brand.test.ts` — assert --color-cta in index.css, og-image.png exists and < 300KB
- [ ] `vitest.config.ts` — minimal config for Node environment (no jsdom needed)
- [ ] `npm install -D vitest sharp` — install test framework and OG image generator

*Tests read static files with `fs.readFileSync`/`fs.statSync` — no server or jsdom required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Preview no WhatsApp mostra card correto | SEO-02 | Requer dispositivo/app real | Compartilhar URL no WhatsApp, verificar título, descrição e imagem |
| Preview no LinkedIn mostra preview correto | SEO-02 | Requer LinkedIn validator | Colar URL em linkedin.com/post/inspector |
| Favicon aparece na aba do browser | SEO-04 | Requer browser real | Abrir localhost:3002, verificar aba do browser |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
