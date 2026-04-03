# Phase 2: Identidade e SEO — Research

**Researched:** 2026-04-03
**Domain:** SEO técnico para SPA, GEO (Generative Engine Optimization), JSON-LD schema, OG image generation, SVG favicon
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Otimização dupla — SEO clássico (Google) + GEO (IAs como ChatGPT, Perplexity, Google AI Overview).
- **D-02:** Público-alvo: empresários brasileiros — tom top-of-funnel, educativo com urgência; intent primário "como implementar IA na empresa".
- **D-03:** Tom do meta description: urgente + problema (FOMO competitivo). Referência: *"A IA está transformando empresas agora. Aprenda a implementar inteligência artificial no seu negócio antes da concorrência. Consultoria gratuita."*
- **D-04:** Keyword mix amplo: "consultoria em IA para empresas", "inteligência artificial para empresas Brasil", "como implementar IA na empresa".
- **D-05:** Schema combinado: `Person` (Raul Pedro) + `LocalBusiness` (RIA) — Person como `employee`/`founder` dentro do LocalBusiness.
- **D-06:** `LocalBusiness.areaServed`: Brasil inteiro.
- **D-07:** `knowsAbout` no Person: inteligência artificial, automação, agentes de IA, transformação digital.
- **D-08:** FAQ JSON-LD com 4-5 perguntas do tipo "Como implementar IA na minha empresa?", "O que é consultoria de IA?", "Quanto custa implementar IA?".
- **D-09:** Domínio placeholder `https://ria.com.br` com comentário HTML indicando onde trocar.
- **D-10:** OG image gerada via Node script (`scripts/generate-og.js`) usando Canvas API ou `sharp` — reproduzível, sem ferramentas externas.
- **D-11:** Visual da OG image: fundo preto (#000000), onda/gradiente azul (#2a42ec), nome "RIA" e tagline em branco. 1200×630px. Output: `public/og-image.png`.
- **D-12:** O script roda uma vez — PNG estático em `/public`, sem geração dinâmica.
- **D-13:** Favicon SVG simples — `public/favicon.svg` com "RI" ou "RIA" em branco sobre fundo #2a42ec. Referenciado como `<link rel="icon" href="/favicon.svg">`.
- **D-14:** Sem multi-size de favicon — browsers modernos aceitam SVG nativamente.
- **D-15:** Adicionar `--color-cta: #2a42ec` no `@theme` do `src/index.css`.

### Claude's Discretion

- Texto exato das perguntas/respostas do FAQ JSON-LD (baseado no copy existente da página).
- `og:title` exato e `og:description` (dentro do tom definido em D-03).
- Estrutura exata do JSON-LD (ordem de campos, campos opcionais) — o que maximiza GEO.

### Deferred Ideas (OUT OF SCOPE)

- Analytics / rastreamento de cliques nos CTAs (Phase 3).
- Sitemap.xml e robots.txt (Phase 3 ou quando tiver domínio real).
- Favicon multi-size com apple-touch-icon.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-01 | Meta description presente no `index.html` | Seção "Technical SEO for SPAs" — tag `<meta name="description">` diretamente no HTML |
| SEO-02 | Open Graph tags completos (og:title, og:description, og:image, og:url) para preview no WhatsApp e LinkedIn | Seção "OG Tags e Social Previews" — campos obrigatórios e limites de tamanho documentados |
| SEO-03 | Meta `twitter:card` para previews no Twitter/X | Seção "Twitter Card" — `summary_large_image` é o tipo correto |
| SEO-04 | Favicon criado e referenciado no `index.html` | Seção "SVG Favicon" — padrão `<link rel="icon" href="/favicon.svg">` |
| SEO-05 | `<link rel="canonical">` no `index.html` | Seção "Technical SEO for SPAs" — tag canônica estática com domínio placeholder |
| BRAND-01 | Cor primária `#2a42ec` registrada como token `--color-cta` no `index.css` | Seção "Design Token" — adição simples no bloco `@theme` do Tailwind v4 |
| BRAND-02 | OG image 1200×630px para preview no compartilhamento | Seção "OG Image Generation" — sharp é a ferramenta certa, já disponível no npm registry |

</phase_requirements>

---

## Summary

Esta fase é de configuração e geração de assets — não altera componentes React. Há três domínios técnicos distintos: (1) edição do `index.html` com meta tags estáticas, (2) geração programática da OG image via script Node.js, e (3) criação do favicon SVG inline.

O ponto mais crítico de execução é a OG image: o WhatsApp tem limite de ~300KB para exibir preview de link. Uma imagem 1200×630px PNG gerada com sharp sem compressão pode facilmente ultrapassar esse limite. O script deve exportar com compressão adequada (PNG level 8+ ou converter para JPEG). Sharp é a escolha correta — já está disponível no npm registry na versão 0.34.5, não está instalado no projeto, precisa ser adicionado como devDependency.

Para GEO, a combinação LocalBusiness + Person + FAQPage em JSON-LD separados (dois `<script>` tags) maximiza a cobertura de entidade. O FAQPage com 4-5 perguntas relevantes ao intent "como implementar IA na empresa" é o maior alavancador de aparições em AI Overviews. Campos `knowsAbout`, `sameAs` e `description` no Person schema são os mais citados como determinantes de autoridade por LLMs.

**Primary recommendation:** Use `sharp` para gerar a OG image programaticamente (sem depender de canvas/cairo bindings), escreva dois blocos JSON-LD separados no `index.html` (um LocalBusiness+Person, um FAQPage), e configure PNG compression ≤ 80% quality para manter arquivo < 300KB.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | 0.34.5 | Geração da OG image PNG no script Node | Sem dependências nativas de sistema no Windows; API simples create+composite+toFile; já disponível no registry |
| (built-in) | — | SVG favicon | SVG é texto puro — nenhuma lib necessária |
| (built-in) | — | Meta tags no index.html | HTML estático — nenhum framework |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 3.x | Testar presença das meta tags via jsdom | Se nyquist_validation ativo — necessário instalação |
| @testing-library/dom | 10.x | Queries de DOM nos testes de meta tags | Junto com vitest |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp | canvas (node-canvas) | canvas requer cairo bindings nativos — problemático no Windows sem build tools instaladas. sharp usa libvips pré-compilada e tem prebuilts para Windows |
| sharp | @vercel/og | @vercel/og é para edge functions (Vercel) — não roda como script local |
| sharp | Puppeteer | Puppeteer (50MB+) para imagem estática gerada uma vez é overhead desnecessário |
| SVG favicon | PNG multi-size | Multi-size requer sharp/imagemagick e mais `<link>` tags — deferred por D-14 |

**Installation:**
```bash
npm install --save-dev sharp
```

**Version verification:** `npm view sharp version` retornou `0.34.5` em 2026-04-03. sharp tem prebuilts para Node 20 no Windows — instalação não requer compilação.

---

## Architecture Patterns

### Recommended Project Structure

```
/
├── index.html                  # meta tags, JSON-LD, canonical, favicon ref
├── public/
│   ├── favicon.svg             # SVG inline com letras "RIA" sobre #2a42ec
│   ├── og-image.png            # gerado por scripts/generate-og.js
│   └── raul.pedro.png          # já existe
├── scripts/
│   └── generate-og.js          # script Node.js ESM que gera og-image.png
└── src/
    └── index.css               # adicionar --color-cta: #2a42ec no @theme
```

### Pattern 1: Meta Tags Estáticas no index.html (SPA)

**What:** WhatsApp e LinkedIn crawlers NÃO executam JavaScript. Todas as meta tags OG devem estar no `<head>` do HTML estático — não em componentes React.

**When to use:** Sempre para SPAs com Vite — o `index.html` é o entry point e é servido diretamente antes de qualquer JS executar.

**Example:**
```html
<!-- Source: https://ogp.me/ + https://developers.google.com/search/docs -->
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RIA — Revolução da Inteligência Artificial</title>

  <!-- SEO -->
  <meta name="description" content="[D-03 tone — max 155 chars]" />
  <link rel="canonical" href="https://ria.com.br" /><!-- TODO: trocar domínio -->

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="RIA — Revolução da Inteligência Artificial" />
  <meta property="og:description" content="[mesma que meta description]" />
  <meta property="og:image" content="https://ria.com.br/og-image.png" /><!-- TODO: trocar domínio -->
  <meta property="og:url" content="https://ria.com.br" /><!-- TODO: trocar domínio -->
  <meta property="og:locale" content="pt_BR" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="RIA — Revolução da Inteligência Artificial" />
  <meta name="twitter:description" content="[mesma que meta description]" />
  <meta name="twitter:image" content="https://ria.com.br/og-image.png" /><!-- TODO: trocar domínio -->

  <!-- Favicon -->
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

  <!-- JSON-LD (dois blocos separados) -->
  <script type="application/ld+json">{ LocalBusiness + Person }</script>
  <script type="application/ld+json">{ FAQPage }</script>
</head>
```

### Pattern 2: JSON-LD LocalBusiness + Person (GEO)

**What:** Dois schemas separados maximizam o parsing dos crawlers — misturar em um único objeto aninhado pode confundir parsers de IA.

**When to use:** Quando o site representa tanto uma entidade de negócio (LocalBusiness) quanto uma pessoa (consultor/founder).

**Example:**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "RIA — Revolução da Inteligência Artificial",
  "description": "Consultoria especializada em implementação de inteligência artificial para empresas brasileiras. Automação, agentes de IA e transformação digital.",
  "url": "https://ria.com.br",
  "areaServed": {
    "@type": "Country",
    "name": "Brasil"
  },
  "serviceType": "Consultoria em Inteligência Artificial",
  "employee": {
    "@type": "Person",
    "name": "Raul Pedro",
    "jobTitle": "Consultor de Inteligência Artificial",
    "knowsAbout": [
      "inteligência artificial",
      "automação de processos",
      "agentes de IA",
      "transformação digital",
      "implementação de IA para empresas"
    ],
    "worksFor": {
      "@type": "LocalBusiness",
      "name": "RIA — Revolução da Inteligência Artificial"
    }
  }
}
```

### Pattern 3: FAQPage JSON-LD (GEO — AI Overviews)

**What:** FAQPage é o schema com maior correlação com aparições em Google AI Overviews e respostas de ChatGPT/Perplexity. As perguntas devem espelhar intent real de busca.

**When to use:** Qualquer página que responde perguntas frequentes — especialmente quando o intent do usuário é informacional.

**Constraints obrigatórios do Google:**
- Todo conteúdo do FAQ deve estar visível na página (ou acessível via expand) — não pode ser só no JSON-LD.
- Cada questão precisa de `name` (texto da pergunta) e `acceptedAnswer.text` (resposta completa).
- HTML permitido nas respostas: `<p>`, `<a>`, `<ul>`, `<ol>`, `<li>`, `<b>`, `<strong>`, `<i>`, `<em>`, `<br>`.

**Implicação para esta fase:** Como a página não tem uma seção de FAQ visível, o JSON-LD FAQPage deve ser usado para GEO/IA (ChatGPT, Perplexity, Gemini) mas NÃO vai gerar rich snippets no Google Search — Google exige que o conteúdo seja visível. Isso é aceitável para o objetivo desta fase.

**Example:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Como implementar inteligência artificial na minha empresa?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Implementar IA começa com um diagnóstico: identificar processos repetitivos que consomem tempo e que podem ser automatizados. A RIA oferece uma sessão estratégica gratuita de 30 minutos para mapear as oportunidades de IA no seu negócio."
      }
    },
    {
      "@type": "Question",
      "name": "O que é consultoria de inteligência artificial para empresas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "É um serviço especializado que ajuda empresas a identificar, planejar e implementar soluções de IA — como automação de atendimento, agentes de IA e análise de dados — sem a necessidade de contratar uma equipe técnica interna."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto custa implementar IA em uma empresa?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O custo varia conforme a complexidade. Muitas soluções de IA para pequenas e médias empresas podem ser implementadas por R$500 a R$5.000/mês. A RIA oferece diagnóstico gratuito para estimar o investimento real para o seu caso."
      }
    },
    {
      "@type": "Question",
      "name": "Quais empresas se beneficiam da inteligência artificial?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Qualquer empresa com processos repetitivos se beneficia — desde e-commerce automatizando atendimento, até escritórios de advocacia automatizando análise de contratos, ou indústrias prevendo falhas em equipamentos com IA."
      }
    },
    {
      "@type": "Question",
      "name": "O que são agentes de IA e como funcionam nos negócios?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Agentes de IA são sistemas autônomos que percebem o contexto, tomam decisões e executam tarefas sem intervenção humana contínua. Para empresas, atuam como assistentes digitais que trabalham 24/7 — respondendo clientes, qualificando leads e automatizando fluxos de trabalho."
      }
    }
  ]
}
```

### Pattern 4: OG Image com sharp

**What:** Criar imagem PNG 1200×630 programaticamente usando `sharp.create()` para o fundo + `composite()` para overlay SVG com texto.

**When to use:** Geração one-shot de imagem estática, sem server, sem Puppeteer.

**Critical constraint:** O PNG final deve ter menos de 300KB para o WhatsApp exibir preview. Com sharp, usar `compressionLevel: 9` ou exportar como JPEG com `quality: 85` é suficiente para manter a imagem abaixo do limite.

**Example:**
```javascript
// scripts/generate-og.js  (Node ESM — "type": "module" no package.json)
// Source: https://sharp.pixelplumbing.com/api-constructor + api-composite
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/og-image.png');
const W = 1200, H = 630;

// Gradiente e texto como SVG overlay
const svgOverlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wave" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#2a42ec" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#2a42ec" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <!-- fundo degradê azul -->
  <ellipse cx="300" cy="500" rx="600" ry="400" fill="url(#wave)" opacity="0.6"/>
  <!-- nome -->
  <text x="80" y="280" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="120" font-weight="bold" fill="#ffffff" opacity="0.95">RIA</text>
  <!-- tagline -->
  <text x="80" y="360" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="36" fill="#ffffff" opacity="0.7">Revolução da Inteligência Artificial</text>
  <!-- sub -->
  <text x="80" y="420" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="24" fill="#ffffff" opacity="0.5">Consultoria em IA para empresas | Brasil</text>
</svg>`;

await sharp({
  create: { width: W, height: H, channels: 3, background: '#000000' }
})
  .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log('OG image gerada:', OUT);
```

**Nota sobre fontes SVG no sharp:** Sharp usa libvips para renderizar SVG via librsvg. Fontes do sistema não são garantidas — usar fontes web-safe genéricas (`Arial`, `Helvetica`, `sans-serif`) é o caminho seguro. Fontes customizadas (Roboto, etc.) exigiriam embed de font-face dentro do SVG, o que aumenta complexidade.

### Pattern 5: SVG Favicon inline

**What:** Arquivo SVG puro com `viewBox="0 0 64 64"`, fundo colorido e texto simples.

**When to use:** Favicon da marca sem dependências — suportado em Chrome, Firefox, Edge. Safari: suporte parcial (macOS 14+ para SVG favicon).

**Browser support (2025):** Chrome 80+, Firefox 41+, Edge 80+ suportam SVG favicon. Safari 17.4+ (macOS) suporta. iOS Safari ainda não suporta SVG favicon — mas o fallback é o ícone padrão do browser, não um erro.

**Example:**
```xml
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#2a42ec"/>
  <text
    x="32" y="44"
    font-family="Helvetica Neue, Arial, sans-serif"
    font-size="28"
    font-weight="bold"
    text-anchor="middle"
    fill="#ffffff"
  >RIA</text>
</svg>
```

**Referência no index.html:**
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

### Pattern 6: Token Tailwind v4

**What:** Tailwind v4 usa CSS custom properties dentro do bloco `@theme` em `src/index.css`. Tokens definidos aqui ficam disponíveis como classes utilitárias (`bg-cta`, `text-cta`, etc.).

**When to use:** Ao adicionar qualquer nova cor de marca ao design system.

**Example:**
```css
/* src/index.css — adicionar dentro do bloco @theme existente */
@theme {
  /* ... tokens existentes ... */
  --color-cta: #2a42ec;
}
```

Isso gera automaticamente `bg-cta`, `text-cta`, `border-cta`, `ring-cta`, `from-cta`, etc. sem configuração adicional.

### Anti-Patterns to Avoid

- **Meta tags em componentes React:** WhatsApp/LinkedIn não executam JS. Tags OG definidas em `<Helmet>` ou similar não serão lidas por scrapers. Usar apenas `index.html` estático.
- **og:image com URL relativa:** WhatsApp rejeita URLs relativas. Sempre usar URL absoluta com protocolo e domínio.
- **PNG sem compressão:** 1200×630 sem compressão pode gerar 800KB+. WhatsApp falha silenciosamente em imagens > 300KB.
- **SVG com fontes customizadas sem embed:** sharp/librsvg não acessa fontes do sistema Windows — o texto pode renderizar em Times New Roman ou não renderizar.
- **JSON-LD FAQPage sem conteúdo visível:** Google não exibe rich snippet se FAQ não estiver na página. Aceitável para GEO, mas não gera benefício no Google Search.
- **Dois schemas no mesmo `<script>` tag como array:** `[{...}, {...}]` é válido pelo spec, mas alguns parsers de IA têm melhor cobertura com blocos `<script>` separados.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gerar PNG 1200×630 | Canvas 2D API manual com node-canvas | `sharp` create + composite | node-canvas requer cairo nativo no Windows; sharp tem prebuilts |
| Otimização de PNG | Loop de compressão manual | `sharp({...}).png({ compressionLevel: 9 })` | Uma linha; resultados determinísticos |
| Validar structured data | Parser JSON-LD próprio | Google Rich Results Test (online) | Valida contra spec oficial |
| Scraping de meta tags para teste | Fetch + regex | jsdom + document.querySelector em vitest | Robusto, sem regex frágil |

**Key insight:** Para esta fase, a única lógica não-trivial é a geração da OG image. Todo o resto (meta tags, favicon, token CSS) é edição de texto estático — não há razão para adicionar abstrações.

---

## Common Pitfalls

### Pitfall 1: OG Image acima de 300KB quebra WhatsApp preview

**What goes wrong:** WhatsApp exibe preview em branco ou sem imagem. Nenhum erro visível ao usuário.
**Why it happens:** WhatsApp crawler tem timeout e limite de download para imagens OG. Imagens > 300KB são ignoradas silenciosamente.
**How to avoid:** Exportar com `sharp.png({ compressionLevel: 9 })`. Verificar tamanho do arquivo com `ls -lh public/og-image.png` após gerar. Alvo: < 200KB. Alternativa: exportar como JPEG com `quality: 80` (geralmente 50-100KB para este tipo de imagem gráfica).
**Warning signs:** Preview aparece no LinkedIn (limite 5MB) mas não no WhatsApp.

### Pitfall 2: og:image sem URL absoluta

**What goes wrong:** WhatsApp e alguns parsers ignoram a tag; LinkedIn pode exibir imagem quebrada.
**Why it happens:** Open Graph spec requer URLs absolutas (com `https://`).
**How to avoid:** Sempre `<meta property="og:image" content="https://dominio.com/og-image.png" />`. Com domínio placeholder, manter comentário HTML indicando onde trocar.
**Warning signs:** Funciona localmente via `<img src="/og-image.png">` mas não em preview externo.

### Pitfall 3: SVG favicon com fontes do sistema no Windows

**What goes wrong:** Texto do favicon aparece em fonte genérica (Times New Roman) ou não renderiza no sharp durante geração do OG image.
**Why it happens:** libvips (sharp) usa librsvg para renderizar SVG, que não acessa fontes instaladas do sistema Windows.
**How to avoid:** No favicon SVG: usar `font-family="Arial, sans-serif"` — Arial está disponível no Windows e na maioria dos sistemas. Para o OG image script: idem, não usar fontes customizadas sem embed.
**Warning signs:** Texto renderizado na imagem gerada parece diferente do esperado.

### Pitfall 4: JSON-LD FAQPage sem conteúdo FAQ visível na página

**What goes wrong:** Google não mostra rich snippets de FAQ no Search (Google Search Console reporta erro ou warning).
**Why it happens:** Google exige que o conteúdo do FAQ seja visível ao usuário na página.
**How to avoid:** Aceitar esta limitação conscientemente — o FAQPage JSON-LD ainda beneficia GEO (ChatGPT, Perplexity, Gemini) mesmo sem rich snippet no Google Search. Documentar no código com comentário.
**Warning signs:** Google Rich Results Test diz "Page is eligible but does not meet requirements" ou similar.

### Pitfall 5: LinkedIn cache de OG tags

**What goes wrong:** LinkedIn mostra preview antigo (título incorreto, imagem antiga) mesmo após corrigir as tags.
**Why it happens:** LinkedIn armazena cache agressivo de OG tags por dias.
**How to avoid:** Usar LinkedIn Post Inspector (`https://www.linkedin.com/post-inspector/`) para forçar re-crawl após deploy.
**Warning signs:** Preview diferente do esperado mesmo com as tags corretas no HTML.

### Pitfall 6: WhatsApp requer servidor ativo para crawl

**What goes wrong:** Preview não aparece em ambiente local (localhost).
**Why it happens:** WhatsApp crawler não acessa localhost; precisa de URL pública.
**How to avoid:** Testar em ambiente deployado ou usar ngrok. Alternativa: usar ferramenta de validação online como `ogp.me` ou `opengraph.xyz`.
**Warning signs:** Funciona localmente no HTML mas não no WhatsApp.

---

## Code Examples

### og:image no index.html (URL relativa vs absoluta)

```html
<!-- ERRADO — URL relativa não funciona em crawlers OG -->
<meta property="og:image" content="/og-image.png" />

<!-- CORRETO — URL absoluta obrigatória -->
<!-- TODO: trocar placeholder quando domínio for definido -->
<meta property="og:image" content="https://ria.com.br/og-image.png" />
```

### Script de geração da OG image (padrão completo)

```javascript
// scripts/generate-og.js
// Source: https://sharp.pixelplumbing.com/api-constructor
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/og-image.png');

const W = 1200;
const H = 630;
const BLUE = '#2a42ec';
const WHITE = '#ffffff';

const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${BLUE}" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <ellipse cx="250" cy="520" rx="700" ry="420" fill="url(#g)"/>
  <text x="72" y="290" font-family="Arial, Helvetica, sans-serif" font-size="130"
        font-weight="bold" fill="${WHITE}" opacity="0.95">RIA</text>
  <text x="72" y="365" font-family="Arial, Helvetica, sans-serif" font-size="34"
        fill="${WHITE}" opacity="0.75">Revolução da Inteligência Artificial</text>
  <text x="72" y="415" font-family="Arial, Helvetica, sans-serif" font-size="22"
        fill="${WHITE}" opacity="0.50">Consultoria em IA para empresas · Brasil</text>
</svg>`;

await sharp({
  create: { width: W, height: H, channels: 3, background: { r: 0, g: 0, b: 0 } }
})
  .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

const stats = (await import('fs')).statSync(OUT);
const kb = Math.round(stats.size / 1024);
console.log(`og-image.png gerada: ${kb}KB — ${kb < 300 ? 'OK para WhatsApp' : 'AVISO: > 300KB, WhatsApp pode nao exibir'}`);
```

### Adição do token --color-cta no index.css

```css
/* src/index.css — dentro do @theme existente, após --color-muted */
@theme {
  /* ... tokens existentes ... */
  --color-cta: #2a42ec;
}
```

### Bloco JSON-LD LocalBusiness+Person (referência estrutural)

```html
<!-- Source: https://schema.org/LocalBusiness + https://schema.org/Person -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "RIA — Revolução da Inteligência Artificial",
  "description": "Consultoria especializada em implementação de inteligência artificial para empresas brasileiras.",
  "url": "https://ria.com.br",
  "areaServed": { "@type": "Country", "name": "Brasil" },
  "serviceType": "Consultoria em Inteligência Artificial",
  "employee": {
    "@type": "Person",
    "name": "Raul Pedro",
    "jobTitle": "Consultor de Inteligência Artificial",
    "knowsAbout": ["inteligência artificial", "automação de processos", "agentes de IA", "transformação digital"]
  }
}
</script>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PNG favicon (16px, 32px, 48px) | SVG favicon único | ~2020 (Chrome 80) | Uma linha no HTML, zero tooling |
| Puppeteer para OG images | sharp create+composite | ~2022 | 10x menos overhead, sem Chrome |
| SEO apenas para Google | SEO + GEO (JSON-LD estruturado) | 2024-2025 | AI Overviews, ChatGPT citations |
| Meta tags via react-helmet | Meta tags estáticas no index.html | Sempre foi melhor para SPA | Crawlers OG não executam JS |
| og:image sem compressão | og:image < 300KB otimizado | Sempre foi limitação do WhatsApp | WhatsApp preview funcional |

**Deprecated/outdated:**
- `<meta name="keywords">`: Ignorado por Google desde 2009; sem efeito em GEO. Não incluir.
- `twitter:card` type `summary` para blog/landing: Usar `summary_large_image` — exibe imagem grande.
- JSON-LD com múltiplos schemas no mesmo `<script>` como array anônimo: Funciona, mas dois blocos separados têm melhor cobertura por parsers de IA.

---

## Open Questions

1. **Domínio final da URL placeholder**
   - What we know: Decisão D-09 define `https://ria.com.br` como placeholder. Domínio real não está definido.
   - What's unclear: Se `ria.com.br` está disponível ou se será outro domínio.
   - Recommendation: Usar `https://ria.com.br` com comentário HTML `<!-- TODO: trocar domínio aqui quando definido -->` em todas as 4 ocorrências no index.html (canonical, og:url, og:image, twitter:image).

2. **`sameAs` no Person schema**
   - What we know: `sameAs` aponta para perfis externos (LinkedIn, Twitter) e é sinal de autoridade para LLMs. LinkedIn está como placeholder.
   - What's unclear: Se existe perfil LinkedIn ou outros perfis sociais ativos.
   - Recommendation: Omitir `sameAs` do JSON-LD enquanto não houver perfil real. Adicionar campo `sameAs` é uma linha de edição futura.

3. **Tamanho do PNG gerado**
   - What we know: PNG 1200×630 com fundo sólido preto e SVG simples + compressão level 9 deve ficar < 200KB. Não testado no ambiente real.
   - What's unclear: Se librsvg no ambiente Windows renderiza o SVG overlay como esperado.
   - Recommendation: O script de geração deve imprimir o tamanho do arquivo gerado. Se > 300KB, exportar como JPEG com quality 80 como fallback (alterar extensão e tag HTML).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `scripts/generate-og.js` | ✓ | v20.17.0 | — |
| npm | Instalar sharp | ✓ | 10.8.2 | — |
| sharp | Geração OG image | ✗ (não instalado) | registry: 0.34.5 | — |
| tsx | Rodar script TS se necessário | ✓ (devDep) | instalado | — |
| vitest | Testes de meta tags | ✗ (não instalado) | — | Testes manuais |
| Servidor público | Testar WhatsApp preview | ✗ | — | ogp.me / opengraph.xyz (online) |

**Missing dependencies with no fallback:**
- `sharp` — necessário para gerar a OG image. Instalar com `npm install --save-dev sharp` antes de rodar o script.

**Missing dependencies with fallback:**
- `vitest` — necessário apenas se nyquist_validation ativo. Fallback: validação manual com Rich Results Test e inspeção do DOM.
- Servidor público — necessário apenas para testar WhatsApp preview. Fallback: ferramentas online de validação OG.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (não instalado — Wave 0 instala) |
| Config file | `vitest.config.ts` — não existe, Wave 0 cria |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | `<meta name="description">` presente no index.html | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ Wave 0 |
| SEO-02 | og:title, og:description, og:image, og:url presentes | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ Wave 0 |
| SEO-03 | `twitter:card` presente e = `summary_large_image` | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ Wave 0 |
| SEO-04 | `<link rel="icon" href="/favicon.svg">` presente | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ Wave 0 |
| SEO-05 | `<link rel="canonical">` presente | unit (parse HTML) | `npx vitest run tests/seo.test.ts` | ❌ Wave 0 |
| BRAND-01 | `--color-cta` no `@theme` do index.css | unit (parse CSS) | `npx vitest run tests/brand.test.ts` | ❌ Wave 0 |
| BRAND-02 | `public/og-image.png` existe e < 300KB | unit (fs check) | `npx vitest run tests/brand.test.ts` | ❌ Wave 0 |

**Nota de implementação dos testes:** Como os arquivos testados são estáticos (HTML, CSS), os testes leem os arquivos do filesystem com `fs.readFileSync` ou `fs.statSync` — não precisam de jsdom nem de um servidor. São testes de "asset present and correct". Vitest + Node.js puro é suficiente.

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Suite verde antes do `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/seo.test.ts` — cobre SEO-01 a SEO-05 (lê index.html, verifica tags)
- [ ] `tests/brand.test.ts` — cobre BRAND-01 (lê index.css, verifica token) e BRAND-02 (verifica public/og-image.png)
- [ ] `vitest.config.ts` — configuração mínima: `{ test: { environment: 'node' } }`
- [ ] Framework install: `npm install --save-dev vitest` (e simultaneamente `npm install --save-dev sharp`)

---

## Sources

### Primary (HIGH confidence)
- [sharp API — Constructor](https://sharp.pixelplumbing.com/api-constructor) — create option, width/height/channels/background
- [sharp API — Composite](https://sharp.pixelplumbing.com/api-composite) — SVG buffer overlay, gravity, blend
- [sharp API — Output/PNG](https://sharp.pixelplumbing.com/api-output#png) — compressionLevel, toFile
- [Google FAQPage Structured Data](https://developers.google.com/search/docs/appearance/structured-data/faqpage) — required fields, content guidelines, visibility rules
- [Schema.org/LocalBusiness](https://schema.org/LocalBusiness) — campos canônicos
- [Open Graph Protocol](https://ogp.me/) — propriedades obrigatórias e opcionais

### Secondary (MEDIUM confidence)
- [npm view sharp — v0.34.5](https://www.npmjs.com/package/sharp) — versão atual verificada em 2026-04-03
- [npm view canvas — v3.2.3](https://www.npmjs.com/package/canvas) — versão de referência para comparação
- [WhatsApp OG Preview Specs](https://ogpreview.app/open-graph/whatsapp/) — limite 300KB verificado em múltiplas fontes
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — ferramenta oficial para forçar re-crawl
- [caniuse — SVG favicons](https://caniuse.com/link-icon-svg) — suporte por browser verificado
- [Google Search Central — sameAs vs knowsAbout](https://willscott.me/2025/07/30/sameas-versus-knowsabout-in-schema/) — distinção semântica para GEO
- [GEO Strapi Guide 2025](https://strapi.io/blog/generative-engine-optimization-geo-guide) — práticas para AI citations

### Tertiary (LOW confidence)
- [Beyond SEO — JSON-LD Powers GEO](https://10xdev.io/blog/beyond-seo-how-json-ld-powers-generative-engine-optimization-geo) — correlação CMU study schema → LLM citation (fonte: WebSearch, artigo de terceiro referenciando estudo KDD 2024)
- [OG Image sizes guide 2025](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide) — tamanhos por plataforma

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — sharp verificado no npm registry; API verificada na documentação oficial
- Architecture: HIGH — padrões de meta tags verificados em OGP spec e Google docs; JSON-LD verificado no schema.org
- OG image pitfalls: HIGH — limite 300KB WhatsApp verificado em múltiplas fontes independentes
- GEO/JSON-LD efficacy: MEDIUM — baseado em artigos de 2025, CMU study referenciado mas não lido diretamente
- SVG favicon Safari support: MEDIUM — caniuse verificado, mas Safari iOS permanece sem suporte confirmado para 2026

**Research date:** 2026-04-03
**Valid until:** 2026-07-03 (90 dias — APIs de meta tags e sharp são estáveis; GEO practices evoluem mais rápido mas os schemas são estáveis)
