# Requirements: RIA — Revolução da Inteligência Artificial

**Defined:** 2026-04-02
**Core Value:** Um empresário que entra na página deve sentir urgência suficiente para clicar em "Agendar" antes de sair — o site converte, não apenas impressiona.

## v1 Requirements

### Conversão (CTAs)

- [ ] **CTA-01**: Botão "Iniciar Transformação" (Hero) abre WhatsApp com mensagem pré-preenchida
- [ ] **CTA-02**: Botão "Agendar Sessão Estratégica" (FinalCTA) abre WhatsApp com mensagem pré-preenchida
- [ ] **CTA-03**: Ícone WhatsApp no FinalCTA linka para WhatsApp
- [ ] **CTA-04**: Ícone Email no FinalCTA linka para email de contato
- [ ] **CTA-05**: Botão "Nossa Metodologia" (Hero) rola a página para a seção de serviços (#servicos)
- [ ] **CTA-06**: FAB flutuante do WhatsApp aparece após 30% de scroll (bottom-right, persistente)
- [ ] **CTA-07**: Todos os links de contato centralizados em `constants/links.ts`

### Correções Críticas

- [ ] **FIX-01**: `index.html` title corrigido de "RAI" para "RIA — Revolução da Inteligência Artificial"
- [ ] **FIX-02**: `index.html` lang corrigido de `"en"` para `"pt-BR"`
- [ ] **FIX-03**: `DataWave3D` armazena e cancela o ID do `requestAnimationFrame` no cleanup
- [ ] **FIX-04**: Seção About exibe foto real (`raul-pedro.png`) ou fallback elegante enquanto foto não existe

### Navegação

- [ ] **NAV-01**: Navbar tem menu mobile funcional (hamburguer / drawer)
- [ ] **NAV-02**: Links da Navbar rolam suavemente para as seções corretas (#servicos, #sobre, #contato)
- [ ] **NAV-03**: Navbar muda de transparente para sólida ao scrollar (legibilidade)

### SEO & Identidade Visual

- [ ] **SEO-01**: Meta description presente no `index.html`
- [ ] **SEO-02**: Open Graph tags completos (og:title, og:description, og:image, og:url) para preview no WhatsApp e LinkedIn
- [ ] **SEO-03**: Meta `twitter:card` para previews no Twitter/X
- [ ] **SEO-04**: Favicon criado e referenciado no `index.html` (ícone da marca RIA)
- [ ] **SEO-05**: `<link rel="canonical">` no `index.html`

### Performance & Mobile

- [ ] **PERF-01**: Canvas `DataWave3D` reduz resolução em viewport < 768px (cols=30, rows=22)
- [ ] **PERF-02**: Canvas respeita `prefers-reduced-motion` (exibe frame estático sem loop)
- [ ] **PERF-03**: Canvas limita `devicePixelRatio` a 1.5 para evitar overdraw em Retina mobile

### Identidade Visual

- [ ] **BRAND-01**: Cor primária `#2a42ec` registrada como token Tailwind `--color-cta` no `index.css`
- [ ] **BRAND-02**: OG image (1200×630px) criada para preview no compartilhamento

## v2 Requirements

### Prova Social

- **PROOF-01**: Seção de resultados concretos (ex: "R$X em leads automatizados")
- **PROOF-02**: Depoimentos de clientes
- **PROOF-03**: Logos de empresas atendidas

### Analytics

- **ANLTC-01**: Analytics cookie-free integrado (Cloudflare Web Analytics ou Umami)
- **ANLTC-02**: Rastreamento de cliques nos CTAs do WhatsApp

### LinkedIn

- **SOCIAL-01**: Link do LinkedIn ativo no FinalCTA e Footer (quando perfil criado)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend / captura de leads server-side | WhatsApp resolve com zero fricção e zero custo |
| Formulário de contato | Anti-feature: adiciona fricção desnecessária para o público-alvo |
| Calendly / agendador embutido | Anti-feature: o WhatsApp é mais direto para o mercado BR |
| Múltiplas páginas / React Router | Landing page de página única — complexidade desnecessária |
| Blog ou conteúdo dinâmico | v2+, fora do escopo desta versão |
| CMS / painel admin | Conteúdo estático por enquanto |
| Autenticação / área de membros | Não é um produto SaaS |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CTA-01 | Phase 1 | Pending |
| CTA-02 | Phase 1 | Pending |
| CTA-03 | Phase 1 | Pending |
| CTA-04 | Phase 1 | Pending |
| CTA-05 | Phase 1 | Pending |
| CTA-07 | Phase 1 | Pending |
| FIX-01 | Phase 1 | Pending |
| FIX-02 | Phase 1 | Pending |
| FIX-03 | Phase 1 | Pending |
| FIX-04 | Phase 1 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 1 | Pending |
| BRAND-01 | Phase 2 | Pending |
| SEO-01 | Phase 2 | Pending |
| SEO-02 | Phase 2 | Pending |
| SEO-03 | Phase 2 | Pending |
| SEO-04 | Phase 2 | Pending |
| SEO-05 | Phase 2 | Pending |
| BRAND-02 | Phase 2 | Pending |
| CTA-06 | Phase 3 | Pending |
| PERF-01 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 após definição inicial*
