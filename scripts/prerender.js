// Prerender da home congelada.
//
// Roda DEPOIS de `vite build` (cliente) e `vite build --ssr`. Ver o script
// "build" em package.json.
//
// O QUE ESTE ARQUIVO FAZ — E O QUE ELE DELIBERADAMENTE NAO FAZ
//
// Faz: injeta no `<div id="root">` o HTML que o React renderiza no servidor, e
// emite robots.txt e sitemap.xml. Ate aqui, o dist publicado tinha
// `<body><div id="root"></div></body>` e mais nada — 7,6 KB de casca. Os
// crawlers que a Frente 1 promete atender (GPTBot, PerplexityBot, ClaudeBot)
// nao executam JavaScript, entao o site que vende "ser citavel por IA" era
// ilegivel para IA.
//
// NAO faz: mexer no <head>. O prerender da versao /v2 gera title, description,
// canonical, OG, Twitter e JSON-LD a partir de content/offer.ts, porque la o
// index.html e um esqueleto de 37 linhas. Aqui o index.html ja traz as 138
// linhas do head escritas a mao, com os dois blocos de JSON-LD inclusive —
// reescreve-las mudaria o texto publicado, que e exatamente o que este porte
// existe para NAO fazer. Se um dia o head daqui precisar mudar, ele muda no
// index.html, que continua sendo a fonte.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const ssrEntry = resolve(root, 'dist-ssr/entry-server.js');

/**
 * URL canonica. Fonte unica do sitemap e do robots.txt. O canonical da pagina
 * continua vindo do index.html, que ja o declara — os dois precisam concordar,
 * e por isso o valor padrao aqui e o mesmo que esta la.
 */
const SITE_URL = (process.env.SITE_URL || 'https://raulvieira.vercel.app').replace(/\/$/, '');

if (!existsSync(ssrEntry)) {
  console.error(`[prerender] Bundle SSR nao encontrado em ${ssrEntry}.`);
  console.error('[prerender] Rode `vite build --ssr src/entry-server.tsx --outDir dist-ssr` antes.');
  process.exit(1);
}

const { render, ROUTES } = await import(pathToFileURL(ssrEntry).href);

const template = readFileSync(resolve(distDir, 'index.html'), 'utf-8');

/**
 * O marcador precisa existir. Se o index.html mudar de forma e o replace virar
 * no-op, o build sairia "com sucesso" publicando de novo a casca vazia — o
 * defeito exato que este arquivo existe para corrigir, agora silencioso.
 */
if (!template.includes('<div id="root"></div>')) {
  console.error('[prerender] `<div id="root"></div>` nao encontrado no index.html do build.');
  console.error('[prerender] Sem o marcador o conteudo nao entra. Abortando em vez de publicar casca vazia.');
  process.exit(1);
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

  const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  /**
   * Cada rota que nao seja a home sai em DOIS arquivos, de proposito:
   *
   *   /rota  -> dist/rota.html        (Vercel cleanUrls, vite preview)
   *   /rota/ -> dist/rota/index.html  (qualquer host com indice de diretorio)
   *
   * Sem o primeiro, um GET em `/rota` (sem barra) cai no rewrite de SPA e
   * devolve a HOME — com o title e o canonical da home. Para um crawler isso e
   * conteudo duplicado apontando canonical errado, que e pior do que a pagina
   * nao existir. Hoje ha uma rota so, mas a regra fica escrita para quando a
   * segunda chegar.
   */
  const targets =
    path === '/'
      ? [resolve(distDir, 'index.html')]
      : [resolve(distDir, `${path.slice(1)}.html`), resolve(distDir, path.slice(1), 'index.html')];

  for (const outPath of targets) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, 'utf-8');
  }

  const kb = (Buffer.byteLength(appHtml, 'utf8') / 1024).toFixed(1);
  console.log(`[prerender] ${path.padEnd(14)} -> ${targets.map((t) => t.replace(root, '.')).join(' + ')} (${kb} KB)`);
  count++;
}

// ─── robots.txt ─────────────────────────────────────────────────────────────
// Explicito para os crawlers de IA. Eles respeitam robots.txt, e o silencio
// anterior (arquivo inexistente) deixava a decisao para o padrao de cada um.
const robots = `# RIA — Revolucao da Inteligencia Artificial

User-agent: *
Allow: /

# Crawlers de IA, nomeados de proposito: a Frente 1 do catalogo existe para
# estas empresas conseguirem ler e citar esta pagina.
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

console.log(`[prerender] ${count} rota(s) prerenderizada(s). Canonico: ${SITE_URL}`);
