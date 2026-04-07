# Phase 3: Conversão e Performance — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 03-convers-o-e-performance
**Areas discussed:** FAB Visual & Identidade, FAB Mensagem WhatsApp, FAB Esconder no FinalCTA, Canvas prefers-reduced-motion

---

## FAB Visual & Identidade

| Option | Description | Selected |
|--------|-------------|----------|
| Icon-only, 56px | Ícone WhatsApp reconhecível, sem label — clean e universal | ✓ |
| Icon + label "Agendar" | Label deixa intenção explícita mas adiciona peso visual | |
| Verde WhatsApp padrão | Cor oficial do WhatsApp — familiar mas fora da identidade RIA | |

**User's choice:** Aprovado — Icon-only, brand blue `--color-cta`, pulse 2-3 ciclos após entrada, Motion spring para animação.
**Notes:** Usuário pediu que Claude pesquisasse best practices e recomendasse como expert. Todas as decisões foram tomadas com base em pesquisa de melhores práticas 2025.

---

## FAB Mensagem WhatsApp

| Option | Description | Selected |
|--------|-------------|----------|
| WHATSAPP_URL_FAB novo | Mensagem própria "ainda considerando" — mais suave que FinalCTA | ✓ |
| WHATSAPP_URL_CTA (existente) | Mesma mensagem do FinalCTA ("quero agendar") | |
| WHATSAPP_URL genérico | Sem texto pré-preenchido — menos fricção mas menos conversão | |

**User's choice:** Aprovado — criar `WHATSAPP_URL_FAB` em `constants/links.ts`.
**Notes:** Mensagem decidida: "Olá Raul, estou visitando seu site e gostaria de saber mais sobre consultoria de IA."

---

## FAB Esconder quando FinalCTA está visível

| Option | Description | Selected |
|--------|-------------|----------|
| Esconder via IntersectionObserver | FAB some quando #contato entra no viewport — sem CTA duplicado | ✓ |
| Sempre visível | FAB permanece em todas as situações — mais simples mas pode irritar | |

**User's choice:** Aprovado — IntersectionObserver no `#contato`, FAB desaparece com animate-out.
**Notes:** Padrão de alta conversão confirmado por best practices (Linear, Vercel).

---

## Canvas Estático (prefers-reduced-motion)

| Option | Description | Selected |
|--------|-------------|----------|
| Frame inicial (t=0, scroll=0) | Grade 3D em repouso, onda distante — semanticamente correto | ✓ |
| Frame mid-animation | Onda visível avançando — mais impactante mas arbitrário | |
| Canvas oculto | Sem canvas para usuários com motion disabled | |

**User's choice:** Aprovado — 1 frame estático com t=0, currentScroll=0, sem rAF loop.
**Notes:** `window.matchMedia('(prefers-reduced-motion: reduce)')` para detecção.

---

## Claude's Discretion

- Ícone exato do WhatsApp (SVG inline vs icon library)
- Tamanho exato do shadow no FAB
- rootMargin do IntersectionObserver para trigger antecipado

## Deferred Ideas

- Analytics de cliques no FAB — v2
- Resize listener para reinicializar DataWave3D ao rotacionar tela — fora do escopo
