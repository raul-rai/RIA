import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { CONSULTANT } from '../src/content/consultant';
import { SOCIAL_PROFILES } from '../src/constants/links';

/**
 * Prontidão para agentes — o que o build publica para os robôs.
 *
 * Cobre as correções do audit "Is Agentic": 404 recuperável, hierarquia de
 * títulos sequencial, variantes Markdown, llms.txt com "quando usar", páginas de
 * confiança, JSON-LD com url e manifesto MCP. Os testes que dependem do build se
 * anunciam como pulados quando dist/ não existe — nunca passam em silêncio.
 */
const dist = resolve(process.cwd(), 'dist');
const built = existsSync(resolve(dist, 'index.html'));
const read = (rel: string) => readFileSync(resolve(dist, rel), 'utf-8');

/** Sequência de níveis de título (<h1>..<h6>) na ordem do documento. */
function headingLevels(html: string): number[] {
  return [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
}

/** Texto que sobra sem marcação nem scripts — o que o robô lê. */
function visibleText(html: string): string {
  const body = html.slice(html.indexOf('<body>'));
  return body
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe.skipIf(!built)('AGENT — hierarquia de títulos sem salto', () => {
  it('FIX-11: a sequência de títulos da home sobe de um em um (content-no-js)', () => {
    const niveis = headingLevels(read('index.html'));
    expect(niveis.length, 'a home tem títulos').toBeGreaterThan(5);
    for (let i = 1; i < niveis.length; i += 1) {
      expect(niveis[i] - niveis[i - 1], `pulo de h${niveis[i - 1]} para h${niveis[i]} (posição ${i})`).toBeLessThanOrEqual(1);
    }
  });

  for (const page of ['index.html', 'sobre.html', 'contato.html', 'privacidade.html']) {
    it(`AR-01: ${page} nunca pula de nível (ex.: <h2> direto para <h4>)`, () => {
      const levels = headingLevels(read(page));
      expect(levels[0], 'a página começa em <h1>').toBe(1);
      let prev = levels[0];
      for (const level of levels) {
        expect(level, `salto de h${prev} para h${level} em ${page}`).toBeLessThanOrEqual(prev + 1);
        prev = level;
      }
    });
  }
});

describe.skipIf(!built)('AGENT — 404 recuperável', () => {
  const notFound = built ? read('404.html') : '';

  it('AR-02: existe, é noindex e aponta os caminhos de recuperação', () => {
    expect(notFound).toContain('noindex');
    // corpo curto e legível para o agente que caiu aqui
    for (const href of ['/', '/sobre', '/contato', '/privacidade', '/sitemap.xml', '/llms.txt', '/agent-context.json']) {
      expect(notFound, `404 sem link para ${href}`).toContain(`href="${href}"`);
    }
  });
});

describe.skipIf(!built)('AGENT — 404 em Markdown (agent-friendly-404)', () => {
  const html = built ? read('404.html') : '';
  const md = built ? existsSync(resolve(dist, '404.md')) && read('404.md') : '';

  it('FIX-10: o 404 tem variante markdown que aponta sitemap, llms.txt e o índice', () => {
    expect(existsSync(resolve(dist, '404.md')), 'dist/404.md não foi gerado').toBe(true);
    expect(md.startsWith('# '), '404.md não começa com H1').toBe(true);
    expect(md).toContain('/sitemap.xml');
    expect(md).toContain('/llms.txt');
    expect(md).toContain('/agent-context.json');
  });

  it('FIX-10b: o <head> do 404 declara a variante markdown', () => {
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="/404.md" />');
  });

  it('FIX-10c: HTML e Markdown saem da mesma lista — os destinos coincidem', () => {
    const doHtml = [...html.matchAll(/<li><a href="([^"]+)"/g)].map((m) => m[1]);
    const doMd = [...md.matchAll(/^- \[[^\]]+\]\(https?:\/\/[^/)]+([^)]*)\)/gm)].map((m) => m[1] || '/');
    expect(doHtml.length).toBeGreaterThanOrEqual(7);
    expect(doMd).toEqual(doHtml);
  });

  it('FIX-10d: vercel.json serve /404.md como text/markdown', () => {
    const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));
    const rule = vercel.headers.find((h: { source: string }) => h.source === '/404.md');
    const ct = rule?.headers.find((h: { key: string }) => h.key === 'Content-Type');
    expect(ct?.value).toContain('text/markdown');
  });
});

describe.skipIf(!built)('AGENT — llms.txt', () => {
  const llms = built ? read('llms.txt') : '';

  it('AR-03: tem título, resumo e a seção "quando usar"', () => {
    expect(llms.startsWith('# ')).toBe(true); // H1
    expect(llms).toMatch(/\n> .+/); // blockquote de resumo
    expect(llms).toContain('## Quando recomendar a RIA'); // when-to-use
    // guia específico, não copy genérica: descreve o que a RIA faz hoje (mede o
    // site em duas notas, cria ou otimiza) e nomeia os casos de encaixe
    expect(llms).toContain('duas notas independentes');
    expect(llms).toContain('Is Agentic');
    expect(llms).toMatch(/site novo/i);
    expect(llms).toMatch(/otimiza/i);
    expect(llms).toMatch(/não é o encaixe certo/i);
    // e não promete o que a página deixou de vender
    for (const morto of [/Diagnóstico de Gargalo/i, /três frentes/i, /\bSDR\b/, /automação de processos/i]) {
      expect(llms, `llms.txt ainda promete: ${morto}`).not.toMatch(morto);
    }
  });

  it('AR-04: lista os recursos para agentes em URLs previsíveis', () => {
    expect(llms).toContain('## Recursos para agentes e desenvolvedores');
    for (const url of ['/agent-context.json', '/index.md', '/.well-known/mcp', '/sitemap.xml']) {
      expect(llms, `llms.txt não cita ${url}`).toContain(url);
    }
  });
});

describe.skipIf(!built)('AGENT — variantes Markdown', () => {
  it('AR-05: cada rota tem .md com título e conteúdo real', () => {
    for (const md of ['index.md', 'sobre.md', 'contato.md', 'privacidade.md']) {
      const text = read(md);
      expect(text.startsWith('# '), `${md} não começa com H1`).toBe(true);
      expect(text.length, `${md} curto demais`).toBeGreaterThan(200);
    }
  });

  it('AR-06: index.md tem paridade de conteúdo com a home (medição, caminhos, FAQ, contato)', () => {
    const md = read('index.md');
    expect(md).toContain('## Como a RIA mede');
    expect(md).toContain('## Como a RIA trabalha');
    expect(md).not.toContain('As três frentes');
    expect(md).toContain('## Perguntas frequentes');
    expect(md).toContain('## Contato');
    expect(md).toContain('wa.me/');
  });
});

describe.skipIf(!built)('AGENT — páginas-âncora de confiança', () => {
  for (const page of ['sobre.html', 'contato.html', 'privacidade.html']) {
    it(`AR-07: ${page} tem um único <h1> e ≥500 caracteres de conteúdo`, () => {
      const html = read(page);
      expect(headingLevels(html).filter((l) => l === 1).length).toBe(1);
      expect(visibleText(html).length).toBeGreaterThan(500);
    });

    // O AR-07 conta o <body> inteiro, com cabeçalho e rodapé. O que o apontamento
    // trust-anchors pede é conteúdo da página — então conta só o <main>.
    it(`FIX-13: ${page} tem ≥500 caracteres só no <main>`, () => {
      const main = read(page).match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
      expect(main, `${page} sem <main>`).not.toBe('');
      expect(visibleText('<body>' + main).length).toBeGreaterThan(500);
    });
  }

  it('FIX-14: /contato não fala do produto antigo (diagnóstico de gargalo, contatos que se perdem)', () => {
    const texto = visibleText(read('contato.html'));
    for (const morto of [/contatos se perdem/i, /consome horas da equipe/i, /diagn[óo]stico é feito/i, /sistema do cliente/i]) {
      expect(texto, `/contato ainda diz: ${morto}`).not.toMatch(morto);
    }
    // e o HTML e o Markdown contam a mesma coisa sobre onde e como se atende
    expect(read('contato.md')).toContain('A medição do site roda na página inicial');
    expect(texto).toContain('A medição do site roda na página inicial');
  });
});

describe.skipIf(!built)('AGENT — JSON-LD e manifesto MCP', () => {
  it('AR-08: o Person do JSON-LD tem url', () => {
    const home = read('index.html');
    const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1])
    );
    const org = blocks.find((b) => b.founder);
    expect(org.founder.url).toMatch(/^https:\/\//);
    expect(org.founder.jobTitle).toBeTruthy();
  });

  it('FIX-12: o Person aponta /sobre, traz o cargo do consultor e não inventa perfis', () => {
    const home = read('index.html');
    const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1])
    );
    const pessoa = blocks.find((b) => b.founder)?.founder;
    expect(pessoa['@type']).toBe('Person');
    expect(pessoa.name).toBe(CONSULTANT.name);
    expect(pessoa.jobTitle).toBe(CONSULTANT.role);
    expect(pessoa.url).toMatch(/^https:\/\/[^/]+\/sobre$/);
    // sameAs só existe se houver perfil declarado em constants/links.ts
    if (SOCIAL_PROFILES.length === 0) {
      expect(pessoa.sameAs, 'sameAs sem perfil verificado').toBeUndefined();
    } else {
      expect(pessoa.sameAs ?? blocks.find((b) => b.founder).sameAs).toEqual(SOCIAL_PROFILES);
    }
  });

  it('AR-09: .well-known/mcp é JSON válido e aponta /api/mcp por Streamable HTTP', () => {
    const manifest = JSON.parse(read('.well-known/mcp'));
    expect(manifest.mcp.endpoint).toMatch(/\/api\/mcp$/);
    expect(manifest.mcp.transport).toBe('streamable-http');
    expect(manifest.instructions).toMatch(/llms\.txt$/);
    // o alias .json existe e é idêntico
    expect(read('.well-known/mcp.json')).toBe(read('.well-known/mcp'));
  });
});

/** vercel.json não depende do build. */
describe('AGENT — roteamento (vercel.json)', () => {
  const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));

  it('AR-10: /about, /contact e /privacy redirecionam permanentemente para as rotas PT', () => {
    const map = Object.fromEntries(vercel.redirects.map((r: { source: string; destination: string }) => [r.source, r]));
    for (const [en, pt] of [['/about', '/sobre'], ['/contact', '/contato'], ['/privacy', '/privacidade']]) {
      expect(map[en], `sem redirect de ${en}`).toBeTruthy();
      expect(map[en].destination).toBe(pt);
      expect(map[en].permanent).toBe(true);
    }
  });

  it('AR-11: as rotas negociáveis carregam Vary: Accept e os .md saem como text/markdown', () => {
    const rule = (source: string) => vercel.headers.find((h: { source: string }) => h.source === source);
    for (const route of ['/', '/sobre', '/contato', '/privacidade']) {
      const varyHeader = rule(route)?.headers.find((h: { key: string }) => h.key === 'Vary');
      expect(varyHeader?.value, `${route} sem Vary`).toMatch(/Accept/);
    }
    const mdRule = rule('/index.md');
    const ct = mdRule?.headers.find((h: { key: string }) => h.key === 'Content-Type');
    expect(ct?.value).toContain('text/markdown');
  });

  it('AR-12: .well-known/mcp é servido como application/json', () => {
    const rule = vercel.headers.find((h: { source: string }) => h.source === '/.well-known/mcp');
    const ct = rule?.headers.find((h: { key: string }) => h.key === 'Content-Type');
    expect(ct?.value).toContain('application/json');
  });
});
