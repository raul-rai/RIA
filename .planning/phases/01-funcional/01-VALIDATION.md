---
phase: 1
slug: funcional
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser verification + TypeScript compiler |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run build` + manual browser check
- **Before `/gsd:verify-work`:** Build must succeed, all CTAs manually tested
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Manual Check | Status |
|---------|------|------|-------------|-----------|-------------------|--------------|--------|
| 1-01-01 | 01 | 1 | CTA-07 | lint | `npm run lint` | constants/links.ts exists | ⬜ pending |
| 1-01-02 | 01 | 1 | FIX-01/02 | lint | `npm run lint` | index.html title/lang correct | ⬜ pending |
| 1-01-03 | 01 | 1 | CTA-01/02 | lint | `npm run lint` | WhatsApp opens on click | ⬜ pending |
| 1-01-04 | 01 | 1 | CTA-03/04/05 | lint | `npm run lint` | All links functional | ⬜ pending |
| 1-01-05 | 01 | 1 | FIX-03 | lint | `npm run lint` | No rAF loop after unmount | ⬜ pending |
| 1-02-01 | 02 | 2 | NAV-01 | manual | — | Mobile menu opens/closes | ⬜ pending |
| 1-02-02 | 02 | 2 | NAV-02/03 | manual | — | Navbar scrolls smooth to sections | ⬜ pending |
| 1-02-03 | 02 | 2 | FIX-04 | manual | — | About photo or fallback visible | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed — validation is TypeScript compile + manual browser verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CTA abre WhatsApp com mensagem | CTA-01, CTA-02 | Deep link para app nativo | Clicar botão, verificar app WhatsApp abre com número e mensagem pré-preenchida |
| Menu mobile abre/fecha | NAV-01 | Interação touch/click | Redimensionar para < 768px, testar hamburguer |
| Scroll suave para seções | NAV-02 | Comportamento visual | Clicar links Navbar, verificar scroll animado com offset correto |
| Navbar muda ao scrollar | NAV-03 | Comportamento visual | Scrollar página, verificar mudança de transparente para sólido |
| About foto ou fallback | FIX-04 | Asset visual | Verificar seção About sem broken image |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (lint) or documented manual check
- [ ] Sampling continuity: every wave has a build check
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
