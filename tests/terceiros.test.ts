import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { PRIVACY_SECTIONS } from '../src/content/privacy';
import { AUTHORITIES } from '../src/content/authorities';
import { EVIDENCE } from '../src/content/evidence';

/**
 * Contrato de TERCEIROS.
 *
 * A regra que este arquivo tranca, e que é a mesma que content/privacy.ts
 * declara no próprio cabeçalho: *política que omite um tratamento que acontece
 * é pior que política nenhuma — vira prova documental contra o controlador*.
 *
 * O defeito (ago/2026): a política listava n8n, LLM, PageSpeed, Cal.com,
 * Analytics e WhatsApp, e omitia dois.
 *
 *   - Google Fonts, carregado em TODA visita por um <link> render-blocking no
 *     index.html. O IP de todo visitante ia para o Google antes de qualquer
 *     clique. Numa página que constrói uma barra de consentimento inteira para
 *     o Analytics, e que declara em voz alta para onde os dados vão.
 *   - YouTube, com iframe_api e player em www.youtube.com (não -nocookie).
 *
 * Foram tratados de formas diferentes de propósito, e a diferença é o ponto:
 * o Fonts foi ELIMINADO (auto-hospedado), o YouTube foi DECLARADO e movido
 * para o domínio sem cookie. Eliminar é sempre melhor que divulgar.
 */

const root = (p: string) => resolve(process.cwd(), p);

function sourceFiles(dir = root('src')): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(tsx?|css)$/.test(entry) ? [full] : [];
  });
}

/**
 * Hosts de terceiro que o código pode citar, e por quê.
 *
 * A distinção que vale: LINK QUE O VISITANTE CLICA não é transferência de
 * dados — é navegação, e é ele quem decide. RECURSO QUE A PÁGINA BUSCA é
 * transferência, aconteça ele por clique (YouTube) ou sozinho (o Google Fonts
 * que saiu daqui). Esta lista é de recursos; os links de citação entram por
 * EVIDENCE, logo abaixo.
 */
const PERMITIDOS = [
  'googleapis.com', // PageSpeed Insights — só o domínio que o visitante pediu
  'wa.me', // WhatsApp — sempre por clique, mensagem visível antes
  'googletagmanager.com', // gtag — só com consentimento explícito
  'youtube-nocookie.com', // player, só depois do clique
  'schema.org', // @context do JSON-LD, não é requisição
  'w3.org', // namespace de SVG, não é requisição
];

/**
 * As fontes das evidências são links de saída, e são o produto daquela dobra:
 * é por poder conferir cada estudo que o argumento pesa. Ler daqui, e não de
 * uma lista fixa, faz uma evidência nova ser aceita sozinha — e mantém a trava
 * fechada para qualquer OUTRO domínio que apareça no código.
 */
const CITACOES = EVIDENCE.map((e) => e.url);

/**
 * Comentários fora — sem comer as URLs.
 *
 * O `[^:]` antes do `//` não é detalhe: sem ele o stripper apaga de
 * `//www.youtube-nocookie.com…` até o fim da linha, porque `https://` também
 * tem duas barras. Foi exatamente assim que a primeira versão deste arquivo
 * "provou" que o código não continha uma URL que ele continha.
 */
function semComentarios(codigo: string): string {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Só o que a página BUSCA, não o que ela oferece para clicar. */
function recursosExternos(html: string): string[] {
  const semComentario = html.replace(/<!--[\s\S]*?-->/g, '');
  return [
    ...semComentario.matchAll(
      /<(?:link|script|img|iframe|source|video|audio|embed)\b[^>]*?\b(?:href|src)="(https?:\/\/[^"]+)"/gi
    ),
  ].map((m) => m[1]);
}

describe('Terceiros — nada carrega sem ação do visitante', () => {
  it('TERC-01: o index.html não busca nada de fora', () => {
    /**
     * O único ponto do site onde um terceiro conseguia entrar SEM clique. Tudo
     * o mais é sob demanda; o <head> é carregado por todo mundo, sempre.
     */
    const html = readFileSync(root('index.html'), 'utf-8');
    const externos = recursosExternos(html);
    expect(externos, `index.html busca de fora: ${externos.join(', ')}`).toEqual([]);
  });

  it('TERC-02: as fontes são auto-hospedadas, não vêm do Google', () => {
    // Sem os comentários: o comentário que substituiu as tags do Google cita o
    // domínio de propósito, para explicar por que ele saiu.
    const html = readFileSync(root('index.html'), 'utf-8').replace(/<!--[\s\S]*?-->/g, '');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');

    // E vêm de algum lugar: sem isto o teste acima passaria com a página sem fonte.
    const main = readFileSync(root('src/main.tsx'), 'utf-8');
    expect(main).toContain('@fontsource-variable/inter');
    expect(main).toContain('@fontsource-variable/playfair-display');

    // A família declarada no tema precisa ser a que o @fontsource registra,
    // senão o CSS pede uma fonte que nenhum @font-face define e a página cai
    // silenciosamente no fallback — com as fontes baixadas e sem uso.
    const css = readFileSync(root('src/index.css'), 'utf-8');
    expect(css).toContain('"Inter Variable"');
    expect(css).toContain('"Playfair Display Variable"');
  });

  it('TERC-03: o player de vídeo usa o domínio sem cookie', () => {
    const modal = semComentarios(readFileSync(root('src/components/VideoModal.tsx'), 'utf-8'));
    expect(modal, 'o iframe do player não aponta para o domínio sem cookie').toContain(
      'https://www.youtube-nocookie.com/embed/'
    );
    expect(modal, 'sobrou um embed no domínio com cookie').not.toMatch(
      /https:\/\/www\.youtube\.com\/embed/
    );

    for (const a of AUTHORITIES) {
      expect(a.videoUrl, `${a.name} aponta para o domínio com cookie`).toContain(
        'youtube-nocookie.com'
      );
    }
  });

  it('TERC-04: nada do YouTube carrega antes do clique', () => {
    /**
     * O padrão facade. A miniatura da lista é um .webp deste domínio, e o
     * iframe do player só é montado quando `isOpen` é verdadeiro. Sem essa
     * guarda, abrir a home já bastaria para o YouTube saber quem é você — e aí
     * o aviso na tela do player chegaria tarde demais.
     *
     * O que este teste protege é a PRECEDÊNCIA, não a forma da guarda: nada do
     * YouTube pode ser montado antes dela. Ver DIAL-07 para por que a guarda é
     * um `return null` e não um `{isOpen && …}` dentro do AnimatePresence.
     */
    const modal = readFileSync(root('src/components/VideoModal.tsx'), 'utf-8');
    const corpo = modal.slice(modal.indexOf('export default function VideoModal'));

    const guarda = corpo.indexOf('if (!isOpen) return null;');
    expect(guarda, 'não achei a guarda de isOpen').toBeGreaterThan(-1);
    expect(guarda, 'o iframe é montado antes da guarda de isOpen').toBeLessThan(
      corpo.indexOf('<iframe')
    );

    for (const a of AUTHORITIES) {
      expect(a.thumbnail, 'miniatura vinda de fora').toMatch(/^\//);
    }
  });

  it('TERC-11: o player não usa a IFrame API, que só existe em www.youtube.com', () => {
    /**
     * O `-nocookie` do player não fecha o buraco sozinho: o SCRIPT da IFrame
     * API é servido apenas por www.youtube.com, e essa requisição revela o IP
     * — levando junto os cookies de quem estiver logado no YouTube.
     *
     * `start` e `end` são parâmetros nativos do embed, então o recorte do
     * trecho não precisa de JavaScript de terceiro nenhum.
     */
    const codigo = semComentarios(readFileSync(root('src/components/VideoModal.tsx'), 'utf-8'));
    expect(codigo, 'a IFrame API voltou').not.toContain('iframe_api');
    expect(codigo, 'YT.Player voltou').not.toContain('YT.Player');
    expect(codigo).toContain('youtube-nocookie.com/embed/');
  });

  it('TERC-05: nenhum host de terceiro no código fora da lista declarada', () => {
    const infratores: string[] = [];
    for (const file of sourceFiles()) {
      // Sem comentários: eles citam de propósito os hosts que saíram, e o
      // histórico do defeito não pode ser causa de falha.
      const texto = semComentarios(readFileSync(file, 'utf-8'));
      for (const m of texto.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(\/[^\s'"`)]*)?/gi)) {
        const alvo = m[1] + (m[2] ?? '');
        const permitido =
          PERMITIDOS.some((p) => alvo.includes(p)) || CITACOES.some((c) => c.startsWith(m[0]));
        if (!permitido) {
          infratores.push(`${file.replace(root('.'), '.')} → ${m[0]}`);
        }
      }
    }
    expect(infratores, `terceiro não declarado:\n${infratores.join('\n')}`).toEqual([]);
  });
});

describe('Terceiros — a política declara o que de fato acontece', () => {
  const texto = PRIVACY_SECTIONS.flatMap((s) => [...s.paragraphs, ...(s.bullets ?? [])])
    .join(' ')
    .toLowerCase();

  it('TERC-06: todo serviço que recebe dado do visitante está na política', () => {
    for (const servico of ['n8n', 'pagespeed', 'cal.com', 'google analytics', 'whatsapp', 'youtube', 'vercel']) {
      expect(texto, `a política não menciona: ${servico}`).toContain(servico);
    }
  });

  it('TERC-07: a política diz que o YouTube só entra por clique e sem cookie', () => {
    expect(texto).toContain('youtube-nocookie.com');
    expect(texto).toMatch(/nada do youtube é carregado antes desse clique/);
  });

  it('TERC-08: a política não promete um Google Fonts que não existe mais', () => {
    // O oposto do defeito original: declarar um tratamento que NÃO acontece é
    // igualmente errado. A menção que sobra é histórica e diz, explicitamente,
    // que ele deixou de acontecer.
    expect(texto).toContain('deixou de acontecer');
  });
});

describe.skipIf(!existsSync(root('dist/index.html')))('Terceiros — o que foi PUBLICADO', () => {
  const home = readFileSync(root('dist/index.html'), 'utf-8');

  it('TERC-09: o HTML publicado não BUSCA nada de fora', () => {
    /**
     * Só tags de recurso. Os <a> para McKinsey, MIT, Cetic.br, HBR e wa.me são
     * links de saída — o visitante decide clicar, e as citações são o produto
     * da dobra de evidências. O que não pode existir é um <link>, <script>,
     * <img> ou <iframe> apontando para fora: esses o navegador busca sozinho,
     * sem o visitante saber.
     */
    const externos = recursosExternos(home).filter((u) => !u.includes('raulvieira.vercel.app'));
    expect(externos, `o build publica requisição externa: ${externos.join(', ')}`).toEqual([]);
  });

  it('TERC-10: as fontes publicadas saem do próprio domínio', () => {
    const cssFile = home.match(/href="(\/assets\/index-[^"]+\.css)"/)?.[1];
    expect(cssFile, 'folha de estilo não encontrada no HTML publicado').toBeTruthy();
    const css = readFileSync(root(`dist${cssFile}`), 'utf-8');
    expect(css).toContain('@font-face');
    expect(css).not.toContain('fonts.gstatic.com');
    expect(css).toMatch(/url\(\/assets\/inter-[^)]+\.woff2\)/);
  });
});
