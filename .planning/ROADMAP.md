# Roadmap: RIA — Revolução da Inteligência Artificial

**Milestone:** v1.0 — Site em Produção
**Goal:** Landing page completamente funcional, conversível e otimizada para compartilhamento

---

## Milestone v1.0

### Phase 1: Funcional

**Goal:** Fazer a página realmente converter — todos os CTAs ligados ao WhatsApp, bugs críticos corrigidos, navegação mobile funcional.

**Requirements:** CTA-01, CTA-02, CTA-03, CTA-04, CTA-05, CTA-07, FIX-01, FIX-02, FIX-03, FIX-04, NAV-01, NAV-02, NAV-03

**Plans:** 3 plans

Plans:
- [x] 01-PLAN.md — Criar constants/links.ts, corrigir index.html (title/lang), fix rAF leak no DataWave3D
- [ ] 02-PLAN.md — Wiring dos CTAs em Hero.tsx e FinalCTA.tsx para WhatsApp e email
- [ ] 03-PLAN.md — Navbar scroll solid + smooth nav + CTAs mobile wired + About photo fallback

**Deliverables:**
- `constants/links.ts` com WhatsApp URL, email e todos os links centralizados
- Todos os `<button>` e `href="#"` convertidos para links reais de WhatsApp
- `index.html`: title "RIA — Revolução da Inteligência Artificial", `lang="pt-BR"`
- `DataWave3D`: cleanup correto do `requestAnimationFrame` (sem memory leak)
- Navbar com menu hamburguer mobile funcional e scroll suave para seções
- Seção About: foto real ou fallback elegante

**Success Criteria:**
- Clicar em qualquer CTA abre WhatsApp com mensagem pré-preenchida
- Menu mobile abre/fecha corretamente
- Links da Navbar rolam suavemente para as seções
- Console do browser sem errors de loop infinito ou imagem quebrada

**UI hint:** yes — envolve modificações em componentes React com Tailwind

---

### Phase 2: Identidade e SEO

**Goal:** Tornar a página encontrável, compartilhável e com identidade visual coesa — meta tags completas, favicon, OG image e design system consolidado.

**Requirements:** SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, BRAND-01, BRAND-02

**Deliverables:**
- `index.html`: meta description, OG tags completos, twitter:card, canonical
- Favicon RIA em `/public` (SVG/PNG gerado programaticamente ou criado)
- OG image 1200×630px para preview no WhatsApp/LinkedIn
- Token `--color-cta` adicionado ao `@theme` do `index.css`

**Success Criteria:**
- Compartilhar a URL no WhatsApp exibe card com título, descrição e imagem
- Compartilhar no LinkedIn exibe preview correto
- Favicon aparece na aba do browser

**UI hint:** yes — geração de assets visuais e HTML estático

---

### Phase 3: Conversão e Performance

**Goal:** Maximizar conversões com FAB persistente do WhatsApp e garantir performance fluida em dispositivos mobile Android de baixo custo.

**Requirements:** CTA-06, PERF-01, PERF-02, PERF-03

**Deliverables:**
- FAB flutuante do WhatsApp (bottom-right, aparece após 30% de scroll, animado com Motion)
- `DataWave3D`: resolução reduzida em mobile (`cols=30, rows=22` em viewport < 768px)
- `DataWave3D`: respeita `prefers-reduced-motion` (frame estático, sem loop)
- `DataWave3D`: `devicePixelRatio` limitado a 1.5

**Success Criteria:**
- FAB visível e funcional em mobile e desktop após scroll
- Animação do canvas roda a 60fps em dispositivo Android mid-range
- Usuário com `prefers-reduced-motion` vê página sem animações excessivas

**UI hint:** yes — novo componente React e otimização do canvas

---

## Backlog (v2+)

- **Prova Social** — seção de resultados concretos, depoimentos, logos de clientes
- **Analytics** — Cloudflare Web Analytics ou Umami (cookie-free, sem LGPD hassle)
- **LinkedIn** — link ativo quando perfil for criado
- **Deploy** — CI/CD no Cloudflare Pages ou similar

---
*Roadmap criado: 2026-04-02*
*Milestone v1.0 — 3 fases | 24 requisitos*
