// Prerender + geração de SEO.
//
// Roda DEPOIS de `vite build` (cliente) e `vite build --ssr`. Ver o script
// "build" em package.json.
//
// O que este arquivo resolve: até ago/2026 o dist publicado tinha
// `<body><div id="root"></div></body>` e mais nada. Os crawlers que a Frente 1
// promete atender (GPTBot, PerplexityBot, ClaudeBot) não executam JavaScript —
// então o site que vende "ser citável por IA" era ilegível para IA.
//
// Aqui cada rota vira um HTML com o conteúdo dentro, mais robots.txt e
// sitemap.xml, mais o JSON-LD gerado a partir da MESMA fonte que a página usa
// (content/offer.ts). É esse compartilhamento que impede a volta do defeito
// antigo, em que o schema e a tela contavam histórias diferentes.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const ssrEntry = resolve(root, 'dist-ssr/entry-server.js');

/**
 * URL canônica do site. Fonte única — canonical, OG, Twitter, sitemap e JSON-LD
 * leem daqui. Antes o domínio estava repetido em sete lugares do index.html,
 * cada um com um comentário dizendo "trocar quando houver domínio próprio".
 *
 * Ainda é um .vercel.app, o que significa autoridade de domínio zero. Quando o
 * domínio real existir, basta definir SITE_URL no ambiente da Vercel.
 */
const SITE_URL = (process.env.SITE_URL || 'https://raulvieira.vercel.app').replace(/\/$/, '');

/**
 * Caminho base. '/' na home; '/v2/' no build de avaliação.
 *
 * Precisa casar com o `base` do vite.config.ts e com o basename do
 * BrowserRouter — os três descrevem a mesma coisa e são lidos da MESMA
 * variável de ambiente (SITE_BASE) exatamente para não poderem divergir.
 */
const SITE_BASE = process.env.SITE_BASE || '/';
const IS_SUBPATH = SITE_BASE !== '/';

/** Onde os arquivos saem. O subpath escreve num diretório próprio. */
const outDir = process.env.PRERENDER_OUT
  ? resolve(root, process.env.PRERENDER_OUT)
  : distDir;

/** URL pública de uma rota, já com o caminho base aplicado. */
function publicUrl(route) {
  const base = SITE_BASE.replace(/\/$/, '');
  if (route === '/') return `${SITE_URL}${base}` || SITE_URL;
  return `${SITE_URL}${base}${route}`;
}

if (!existsSync(ssrEntry)) {
  console.error(`[prerender] Bundle SSR não encontrado em ${ssrEntry}.`);
  console.error('[prerender] Rode `vite build --ssr src/entry-server.tsx --outDir dist-ssr` antes.');
  process.exit(1);
}

// FAQ e metadados vêm reexportados pela mesma entrada — ver a nota em
// src/entry-server.tsx.
const {
  render,
  ROUTES,
  FAQ,
  metaFor,
  FRONTS,
  CONSULTANT,
  SOCIAL_PROFILES,
  PHONE_E164,
} = await import(pathToFileURL(ssrEntry).href);

const template = readFileSync(resolve(outDir, 'index.html'), 'utf-8');

// ─── JSON-LD ────────────────────────────────────────────────────────────────
// Gerado, não escrito à mão, e a partir das MESMAS fontes que a página
// renderiza: FAQ e OFFER de content/offer.ts, as frentes de content/fronts.ts,
// o consultor de content/consultant.ts. É isso que impede o defeito antigo, em
// que o schema e a tela contavam histórias diferentes — e o crawler sabia mais
// que o comprador.
//
// O QUE FALTAVA (GEO-01, ago/2026)
//
// Havia dois blocos: ProfessionalService e FAQPage. Para um motor generativo
// isso responde "existe um negócio" e "ele responde estas perguntas", e não
// responde nenhuma das três coisas que ele precisa saber para CITAR a página:
//
//   qual é o site      -> WebSite, com publisher e idioma
//   o que se vende     -> Service, uma por frente, ligada ao provedor
//   como é a marca     -> logo, image, telephone
//
// Sem o Service, as três frentes existiam só como texto solto no HTML: o motor
// tinha que INFERIR que "Agente SDR 24/7" era um serviço à venda. Com ele, a
// oferta é declarada. É a diferença entre ser lido e ser citado — que é
// exatamente o que a Frente 1 do catálogo vende.

/** `@id` estáveis, para os blocos se referenciarem em vez de se repetirem. */
const ID_ORG = `${publicUrl('/')}#organizacao`;
const ID_SITE = `${publicUrl('/')}#site`;

const ORG_NAME = 'RIA — Revolução da Inteligência Artificial';
const ORG_DESCRIPTION =
  'Consultoria de IA para empresas brasileiras. O trabalho começa por medir onde está o gargalo — engenharia de produção aplicada a inteligência artificial.';

/** O que a imagem de compartilhamento mostra. Ver scripts/generate-og.js. */
const OG_IMAGE_ALT =
  'RIA — Revolução da Inteligência Artificial. Consultoria em IA para empresas, Brasil.';

function assetUrl(file) {
  return `${SITE_URL}${SITE_BASE.replace(/\/$/, '')}/${file}`;
}

function buildOrganization() {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ID_ORG,
    name: ORG_NAME,
    description: ORG_DESCRIPTION,
    url: publicUrl('/'),
    /**
     * PNG e não o favicon.svg: a orientação do Google para `logo` pede um
     * raster (jpg/png/gif) de pelo menos 112x112. O apple-touch-icon é a marca
     * em 180x180 e já está publicado — não há por que gerar outro arquivo.
     */
    logo: assetUrl('apple-touch-icon.png'),
    image: assetUrl('og-image.png'),
    telephone: PHONE_E164,
    areaServed: { '@type': 'Country', name: 'Brasil' },
    serviceType: 'Consultoria em Inteligência Artificial',
    founder: {
      '@type': 'Person',
      name: CONSULTANT.name,
      // Vem de content/consultant.ts pela ponte do entry-server. Antes era
      // copiado à mão aqui, com um comentário admitindo que a concordância era
      // manual — e um cargo divergente faria o schema afirmar algo que a tela
      // não mostra.
      jobTitle: CONSULTANT.role,
      alumniOf: {
        '@type': 'CollegeOrUniversity',
        name: 'Universidade Federal de São Carlos',
      },
      knowsAbout: [
        'diagnóstico de gargalo de processo',
        'engenharia de produção',
        'agentes de IA',
        'automação de processos',
        'otimização para busca generativa (GEO)',
      ],
    },
  };

  // Só declara `sameAs` se houver perfil verificado. Ver a nota em
  // constants/links.ts: associar a marca ao perfil errado é silencioso, e
  // desfazer depois custa mais do que não afirmar agora.
  if (SOCIAL_PROFILES && SOCIAL_PROFILES.length > 0) {
    org.sameAs = SOCIAL_PROFILES;
  }

  return org;
}

function buildWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ID_SITE,
    name: ORG_NAME,
    url: publicUrl('/'),
    inLanguage: 'pt-BR',
    publisher: { '@id': ID_ORG },
    // Sem `potentialAction: SearchAction`: esta página não tem busca. Declarar
    // uma caixa de busca que não existe é convidar o Google a exibir um recurso
    // que quebra no clique.
  };
}

/** Uma Service por frente, do MESMO array que os cartões renderizam. */
function buildServices() {
  if (!FRONTS) {
    console.warn('[prerender] content/fronts.ts não chegou — nenhuma Service foi gerada.');
    return [];
  }
  return FRONTS.map((front) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${publicUrl('/')}#frente-${front.id}`,
    name: front.label,
    description: front.promise,
    serviceType: front.tag,
    provider: { '@id': ID_ORG },
    areaServed: { '@type': 'Country', name: 'Brasil' },
  }));
}

function buildFaq() {
  if (!FAQ) {
    console.warn('[prerender] content/offer.ts não pôde ser carregado — FAQPage não foi gerado.');
    return null;
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/**
 * Trilha de navegação. Só para rota interna: numa home o breadcrumb é um item
 * apontando para si mesma, que o Google ignora e que só ocupa bytes.
 */
function buildBreadcrumb(route) {
  if (route === '/') return null;

  /**
   * O nome do degrau, não o <title>.
   *
   * `metaFor('/privacidade').title` é "RIA — Política de Privacidade", e todo
   * título do site carrega esse prefixo de marca. Numa trilha ele sairia como
   * "Início › RIA — Política de Privacidade", repetindo a marca dentro do
   * caminho dela mesma. O degrau é só o nome da página.
   */
  const nome = metaFor(route).title.replace(/^RIA\s*[—–-]\s*/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: publicUrl('/') },
      { '@type': 'ListItem', position: 2, name: nome, item: publicUrl(route) },
    ],
  };
}

/**
 * O JSON-LD de UMA rota.
 *
 * Era emitido só na home, e o efeito colateral era que /privacidade não
 * declarava nem onde estava. Agora cada rota recebe o que lhe cabe: a home
 * carrega o negócio, o site, a oferta e o FAQ; as internas carregam a trilha.
 */
function buildJsonLd(route) {
  const blocks =
    route === '/'
      ? [buildOrganization(), buildWebSite(), ...buildServices(), buildFaq()]
      : [buildBreadcrumb(route)];

  return blocks
    .filter(Boolean)
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n    ');
}

// ─── Meta por rota ──────────────────────────────────────────────────────────
// Os textos NÃO moram mais aqui: vêm de src/content/meta.ts, o mesmo módulo que
// as páginas leem para restaurar o título na navegação client-side. Enquanto os
// dois lados lerem daquele arquivo, é impossível o título publicado e o título
// que o React deixa no DOM contarem histórias diferentes — que era exatamente o
// defeito, e o que o Googlebot indexava era a versão errada.

function applyHead(html, route) {
  const meta = metaFor(route);
  const canonical = publicUrl(route);
  const ogImage = assetUrl('og-image.png');

  /**
   * O build de subpath (/v2) sai NOINDEX, e isso não é detalhe.
   *
   * Home e /v2 são duas versões do mesmo negócio, com os mesmos serviços e o
   * mesmo telefone. Deixar as duas indexáveis faz o Google escolher sozinho
   * qual mostrar, dividir os sinais entre elas e possivelmente exibir a que
   * você não quer — o problema clássico de conteúdo duplicado, agora
   * autoinfligido. Enquanto /v2 for vitrine, ele não entra em índice nenhum.
   *
   * Quando /v2 virar a home, esta marcação some junto com o subpath.
   */
  const robots = IS_SUBPATH
    ? '<meta name="robots" content="noindex, nofollow" />'
    : '';

  // Remove o que o index.html de origem trazia, para não duplicar tags.
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '')
    .replace(/<meta property="og:[^"]*"[^>]*>/g, '')
    .replace(/<meta name="twitter:[^"]*"[^>]*>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

  const head = `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <link rel="canonical" href="${canonical}" />
    ${robots}

    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="RIA — Revolução da Inteligência Artificial" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <!-- og:image:alt é o texto que leitores de tela anunciam quando o card é
         compartilhado no LinkedIn ou no WhatsApp. Sem ele, o card chega mudo:
         a imagem carrega TODO o nome da marca em texto desenhado, que nenhuma
         tecnologia assistiva alcança. -->
    <meta property="og:image:alt" content="${OG_IMAGE_ALT}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:image:alt" content="${OG_IMAGE_ALT}" />

    ${buildJsonLd(route)}
  `;

  return out.replace('</head>', `${head}\n  </head>`);
}

// ─── Render ─────────────────────────────────────────────────────────────────
let count = 0;
for (const { path } of ROUTES) {
  let appHtml;
  try {
    appHtml = render(path);
  } catch (err) {
    console.error(`[prerender] Falhou ao renderizar ${path}:`, err);
    process.exit(1);
  }

  let html = applyHead(template, path);
  html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  /**
   * Cada rota sai em DOIS arquivos, de propósito:
   *
   *   /privacidade  -> dist/privacidade.html        (Vercel cleanUrls, vite preview)
   *   /privacidade/ -> dist/privacidade/index.html  (qualquer host com índice de diretório)
   *
   * Sem o primeiro, um GET em `/privacidade` (sem barra) cai no rewrite de SPA
   * e devolve a HOME — com o title e o canonical da home. Verificado: era
   * exatamente o que acontecia. Para um crawler isso é conteúdo duplicado
   * apontando canonical errado, que é pior do que a página não existir.
   *
   * Os dois arquivos saem do mesmo `html`, então não há como divergirem.
   */
  const targets =
    path === '/'
      ? [resolve(outDir, 'index.html')]
      : [resolve(outDir, `${path.slice(1)}.html`), resolve(outDir, path.slice(1), 'index.html')];

  for (const outPath of targets) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, 'utf-8');
  }

  const kb = (Buffer.byteLength(appHtml, 'utf8') / 1024).toFixed(1);
  console.log(
    `[prerender] ${path.padEnd(14)} -> ${targets.map((t) => t.replace(root, '.')).join(' + ')} (${kb} KB)`
  );
  count++;
}

// ─── robots.txt + sitemap.xml ───────────────────────────────────────────────
// Só o site da RAIZ os emite. Num subpath noindex eles seriam contraditórios:
// um sitemap convidando o robô a indexar páginas que a própria meta proíbe.
if (IS_SUBPATH) {
  console.log(
    `[prerender] ${count} rota(s) em ${SITE_BASE} — noindex, sem sitemap. Base: ${publicUrl('/')}`
  );
  process.exit(0);
}


// Explícito para os crawlers de IA. Eles respeitam robots.txt, e o silêncio
// anterior (arquivo inexistente) deixava a decisão para o padrão de cada um.
const robots = `# RIA — Revolução da Inteligência Artificial

User-agent: *
Allow: /

# Crawlers de IA, nomeados de propósito: a Frente 1 do catálogo existe para
# estas empresas conseguirem ler e citar esta página.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(resolve(distDir, 'robots.txt'), robots, 'utf-8');
console.log('[prerender] robots.txt   -> ./dist/robots.txt');

// ─── sitemap.xml ────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  ({ path, changefreq, priority }) => `  <url>
    <loc>${path === '/' ? SITE_URL : `${SITE_URL}${path}`}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
).join('\n')}
</urlset>
`;
writeFileSync(resolve(distDir, 'sitemap.xml'), sitemap, 'utf-8');
console.log('[prerender] sitemap.xml  -> ./dist/sitemap.xml');

console.log(`[prerender] ${count} rota(s) prerenderizada(s). Canônico: ${SITE_URL}`);
