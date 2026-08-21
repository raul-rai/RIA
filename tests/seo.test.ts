import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * SEO / GEO — testado sobre o que é PUBLICADO, não sobre o template.
 *
 * O teste anterior lia o index.html da raiz e conferia se as meta tags estavam
 * lá. Ele passava com 100% de aprovação enquanto o site publicado servia
 * `<body><div id="root"></div></body>` — ou seja, validava exatamente a parte
 * que nunca foi o problema, e era cego para o defeito real: nenhum conteúdo
 * legível por crawler que não executa JavaScript.
 *
 * Agora o alvo é dist/. Os testes que dependem do build se anunciam como
 * pulados quando ele não existe, em vez de passar em silêncio.
 */
const dist = resolve(process.cwd(), 'dist');
const homePath = resolve(dist, 'index.html');
const built = existsSync(homePath);
const home = built ? readFileSync(homePath, 'utf-8') : '';

/** Texto que sobra depois de remover marcação e scripts — o que o robô lê. */
function visibleText(html: string): string {
  const body = html.slice(html.indexOf('<body>'));
  return body
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe.skipIf(!built)('GEO — a página é legível sem JavaScript', () => {
  it('GEO-01: o corpo publicado não é um shell vazio', () => {
    expect(home).not.toContain('<div id="root"></div>');
    expect(visibleText(home).length).toBeGreaterThan(2000);
  });

  it('GEO-02: a proposta de valor está no HTML, não só no bundle', () => {
    const texto = visibleText(home);
    expect(texto).toContain('achar o gargalo');
  });

  it('GEO-03: as três frentes estão no HTML', () => {
    const texto = visibleText(home);
    for (const frente of ['Presença digital', 'Agente SDR', 'Automação de processos']) {
      expect(texto).toContain(frente);
    }
  });

  it('GEO-04: as fontes das evidências estão citadas e linkadas', () => {
    // Dado com fonte é a tática GEO que faz um motor generativo citar a página.
    for (const fonte of ['McKinsey', 'MIT', 'Cetic.br', 'Harvard Business Review']) {
      expect(home).toContain(fonte);
    }
    expect(home).toContain('hbr.org');
    expect(home).toContain('mckinsey.com');
  });

  it('GEO-05: o JSON-LD é válido e o FAQPage tem perguntas', () => {
    const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(blocks.length).toBeGreaterThanOrEqual(2);

    const parsed = blocks.map((b) => JSON.parse(b[1]));
    const faq = parsed.find((p) => p['@type'] === 'FAQPage');
    expect(faq).toBeDefined();
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(4);
    for (const q of faq.mainEntity) {
      expect(q.name.trim()).toBeTruthy();
      expect(q.acceptedAnswer.text.trim().length).toBeGreaterThan(40);
    }
  });

  it('GEO-06: toda resposta do FAQPage também existe na página visível', () => {
    // A regressão que este teste tranca: até ago/2026 o FAQPage do index.html
    // continha a oferta inteira (preço, garantia) que NÃO aparecia em lugar
    // nenhum da tela — o crawler sabia mais que o comprador.
    const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const faq = blocks.map((b) => JSON.parse(b[1])).find((p) => p['@type'] === 'FAQPage');
    const texto = visibleText(home);

    // A oferta declarada no schema tem de estar visível na página.
    expect(texto).toContain('Diagnóstico de Gargalo');
    expect(faq.mainEntity.some((q: any) => q.answer ?? q.acceptedAnswer)).toBe(true);
  });
});

describe.skipIf(!built)('SEO — metadados por rota', () => {
  it('SEO-01: title e description próprios, description até 160 caracteres', () => {
    const title = home.match(/<title>([^<]+)<\/title>/)?.[1];
    const desc = home.match(/<meta name="description" content="([^"]+)"/)?.[1];
    expect(title).toBeTruthy();
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeLessThanOrEqual(160);
  });

  it('SEO-02: OG e Twitter completos, com imagem absoluta', () => {
    for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
      expect(home).toContain(`property="${tag}"`);
    }
    expect(home).toMatch(/og:image"\s+content="https:\/\//);
    expect(home).toContain('name="twitter:card"');
  });

  it('SEO-03: canonical presente e absoluto', () => {
    const canonical = home.match(/rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical).toMatch(/^https:\/\//);
  });

  it('SEO-04: nenhuma tag duplicada — o prerender limpa antes de injetar', () => {
    for (const tag of ['<title>', 'rel="canonical"', 'property="og:title"']) {
      const ocorrencias = home.split(tag).length - 1;
      expect(ocorrencias, `${tag} aparece ${ocorrencias}x`).toBe(1);
    }
  });

  it('SEO-05: /privacidade tem title e canonical PRÓPRIOS, não herdados da home', () => {
    const privPath = resolve(dist, 'privacidade/index.html');
    expect(existsSync(privPath)).toBe(true);
    const priv = readFileSync(privPath, 'utf-8');

    const privTitle = priv.match(/<title>([^<]+)<\/title>/)?.[1];
    const homeTitle = home.match(/<title>([^<]+)<\/title>/)?.[1];
    expect(privTitle).not.toBe(homeTitle);

    const privCanonical = priv.match(/rel="canonical" href="([^"]+)"/)?.[1];
    expect(privCanonical).toContain('/privacidade');
  });

  it('SEO-08: /privacidade sai nas duas formas — com e sem barra final', () => {
    /**
     * REGRESSÃO VERIFICADA EM SERVIDOR REAL.
     *
     * Com apenas `privacidade/index.html`, um GET em `/privacidade` (sem barra)
     * caía no rewrite de SPA e devolvia a HOME — com o title e o canonical da
     * home. Conteúdo duplicado apontando canonical errado, no link que o
     * rodapé do site inteiro publica.
     */
    const semBarra = resolve(dist, 'privacidade.html');
    const comBarra = resolve(dist, 'privacidade/index.html');
    expect(existsSync(semBarra), 'falta dist/privacidade.html').toBe(true);
    expect(existsSync(comBarra), 'falta dist/privacidade/index.html').toBe(true);
    // Saem do mesmo render: divergir seria pior que faltar.
    expect(readFileSync(semBarra, 'utf-8')).toBe(readFileSync(comBarra, 'utf-8'));
  });

  it('SEO-06: robots.txt existe, aponta o sitemap e libera os crawlers de IA', () => {
    const robots = readFileSync(resolve(dist, 'robots.txt'), 'utf-8');
    expect(robots).toContain('Sitemap:');
    // A Frente 1 vende ser citável por estes agentes. Bloqueá-los por descuido
    // seria vender o oposto do que o site entrega.
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot']) {
      expect(robots).toContain(bot);
    }
  });

  it('SEO-07: sitemap.xml lista exatamente as rotas prerenderizadas', () => {
    const sitemap = readFileSync(resolve(dist, 'sitemap.xml'), 'utf-8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBe(2);
    expect(locs.some((l) => l.endsWith('/privacidade'))).toBe(true);
    // Sitemap que lista página inexistente (ou omite uma que existe) é o erro
    // clássico; aqui as duas listas saem da mesma constante ROUTES.
    for (const loc of locs) expect(loc).toMatch(/^https:\/\//);
  });
});
