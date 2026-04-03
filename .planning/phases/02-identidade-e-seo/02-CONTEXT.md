# Phase 2: Identidade e SEO — Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Tornar a página encontrável e compartilhável — meta tags completas, structured data para SEO + GEO, OG image gerada programaticamente, favicon SVG e token de cor. Esta fase não altera componentes React nem copy da página.

**In scope:** index.html, index.css, public/, script de geração da OG image, JSON-LD.
**Out of scope:** redesign de componentes, mudanças de copy, backend, analytics.

</domain>

<decisions>
## Implementation Decisions

### SEO Strategy
- **D-01:** Otimização dupla — SEO clássico (Google) + GEO (Generative Engine Optimization para IAs como ChatGPT, Perplexity, Google AI Overview).
- **D-02:** Público-alvo: empresários brasileiros curiosos sobre IA mas sem direcionamento claro — tom top-of-funnel, educativo com urgência ("como implementar IA na empresa" é o intent primário).
- **D-03:** Tom do meta description: urgente + problema — captura FOMO competitivo. Exemplo de referência: *"A IA está transformando empresas agora. Aprenda a implementar inteligência artificial no seu negócio antes da concorrência. Consultoria gratuita."*
- **D-04:** Keyword mix amplo: cobre "consultoria em IA para empresas", "inteligência artificial para empresas Brasil", "como implementar IA na empresa" — sem focar em uma só, priorizando abrangência.

### Structured Data (JSON-LD para GEO)
- **D-05:** Schema combinado: `Person` (Raul Pedro) + `LocalBusiness` (RIA) — Person como `employee`/`founder` dentro do LocalBusiness. Máxima cobertura de entidade.
- **D-06:** `LocalBusiness.areaServed`: Brasil inteiro (não geo-restrito a uma cidade).
- **D-07:** `knowsAbout` no Person: inteligência artificial, automação, agentes de IA, transformação digital.
- **D-08:** FAQ JSON-LD com 4-5 perguntas do tipo "Como implementar IA na minha empresa?", "O que é consultoria de IA?", "Quanto custa implementar IA?" — aumenta presença em AI Overviews e respostas de IAs.
- **D-09:** Domínio ainda TBD — usar placeholder `https://ria.com.br` (ou similar) que pode ser trocado trivialmente em uma variável. Deixar comentário no HTML indicando onde trocar.

### OG Image (BRAND-02)
- **D-10:** Gerada via Node script (`scripts/generate-og.js`) usando Canvas API ou `sharp` — não depende de ferramenta externa, reproduzível no CI.
- **D-11:** Visual: fundo preto (#000000), onda/gradiente azul (#2a42ec) evocando o tsunami, nome "RIA" e tagline em branco. 1200×630px. Output: `public/og-image.png`.
- **D-12:** O script roda uma vez e o PNG fica estático em `/public` — não é geração dinâmica.

### Favicon (SEO-04)
- **D-13:** SVG simples — `public/favicon.svg` com as letras "RI" ou "RIA" em branco sobre fundo #2a42ec. Referenciado no index.html como `<link rel="icon" href="/favicon.svg">`.
- **D-14:** Sem multi-size por enquanto — browsers modernos aceitam SVG nativamente.

### Design Token (BRAND-01)
- **D-15:** Adicionar `--color-cta: #2a42ec` no `@theme` do `src/index.css`. Mantém a cor atualmente hard-coded no Hero como token oficial.

### Claude's Discretion
- Texto exato das perguntas/respostas do FAQ JSON-LD — Claude pode escrever baseado no copy existente da página.
- `og:title` exato e `og:description` — Claude escreve dentro do tom definido em D-03.
- Estrutura exata do JSON-LD (ordem de campos, campos opcionais) — Claude decide o que maximiza GEO.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/REQUIREMENTS.md` — Requirements SEO-01 a SEO-05, BRAND-01, BRAND-02 (todos pending)
- `.planning/ROADMAP.md` — Phase 2 deliverables e success criteria
- `index.html` — Estado atual (tem title, sem qualquer SEO)
- `src/index.css` — @theme existente (adicionar --color-cta aqui)
- `src/components/Hero.tsx` — Referência de copy e tom da página para escrever meta texts
- `src/components/FinalCTA.tsx` — Referência adicional de copy e CTAs

**External standards:**
- Schema.org Person: https://schema.org/Person
- Schema.org LocalBusiness: https://schema.org/LocalBusiness
- Schema.org FAQPage: https://schema.org/FAQPage
- Open Graph protocol: https://ogp.me/
- Twitter Card meta tags: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup

</canonical_refs>

<deferred>
## Deferred Ideas

- Analytics / rastreamento de cliques nos CTAs (CTA-06 já está no backlog como Phase 3)
- Sitemap.xml e robots.txt (pode ser Phase 3 ou quando tiver domínio real)
- Favicon multi-size com apple-touch-icon (pode adicionar se surgirem pedidos de usuários mobile)

</deferred>
