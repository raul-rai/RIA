import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { gzipSync } from 'zlib';

/**
 * PERF-02 — o pacote deixa de ser um bloco só.
 *
 * O defeito (ago/2026): `vite build` produzia UM arquivo de 496 KB (158 KB
 * gzip) com absolutamente tudo dentro — React, motion, router, e o app.
 *
 * Duas consequências, e a segunda é a que dói mais:
 *
 * 1. O motion inteiro descia por causa de `motion.div`. Drag, animação de
 *    layout, projeção — nada disso é usado nesta página, e tudo isso vinha.
 *
 * 2. Com um arquivo só, uma vírgula mexida em qualquer componente trocava o
 *    hash do pacote inteiro. Quem voltava ao site depois de uma publicação
 *    rebaixava os 158 KB de novo, incluindo um React que não muda desde a
 *    instalação. O cache do navegador existia e nunca era usado.
 *
 * O QUE ESTE ARQUIVO NÃO EXIGE
 *
 * Divisão por rota. Ela exigiria `lazy` nas páginas, e as páginas são
 * renderizadas no servidor pelo prerender — `renderToString`, síncrono, sem
 * como esperar módulo assíncrono. Um `lazy` no caminho do prerender derruba o
 * build, e desistir do prerender custaria a legibilidade por crawler, que é o
 * produto que a Frente 1 vende. A divisão aqui é por VIDA ÚTIL.
 */

const raiz = process.cwd();
const ler = (p: string) => readFileSync(resolve(raiz, p), 'utf-8');
const assets = resolve(raiz, 'dist/assets');
const construido = existsSync(assets);

/** Só os .tsx que renderizam algo — as páginas e os componentes. */
function arquivosTsx(dir = 'src'): string[] {
  const saida: string[] = [];
  for (const entrada of readdirSync(resolve(raiz, dir), { withFileTypes: true })) {
    const rel = join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...arquivosTsx(rel));
    else if (entrada.name.endsWith('.tsx')) saida.push(rel);
  }
  return saida;
}

describe('PERF-02 — só o motor de animação que a página usa', () => {
  it('PAC-01: o App envolve tudo num LazyMotion com domAnimation, em modo strict', () => {
    const app = ler('src/App.tsx');
    expect(app).toMatch(/import \{[^}]*\bLazyMotion\b[^}]*\} from 'motion\/react'/);
    expect(app).toMatch(/import \{[^}]*\bdomAnimation\b[^}]*\} from 'motion\/react'/);
    expect(app).toMatch(/<LazyMotion features=\{domAnimation\} strict>/);

    const abre = app.indexOf('<LazyMotion');
    const fecha = app.indexOf('</LazyMotion>');
    expect(fecha).toBeGreaterThan(abre);
    expect(app.slice(abre, fecha)).toContain('<Routes>');
  });

  it('PAC-02: domAnimation e não domMax — a página não usa drag nem layout', () => {
    /**
     * A diferença entre os dois conjuntos é exatamente `drag` e `layout`.
     * Se um dia alguém usar `layout` ou `drag` num componente, este teste falha
     * e obriga a decisão consciente de subir para `domMax` — em vez de a
     * animação simplesmente não acontecer, calada.
     */
    const proibidos = /(?:^|\s)(drag|layout|layoutId|dragControls)=[{"]/;
    const infratores: string[] = [];

    for (const arquivo of arquivosTsx()) {
      ler(arquivo)
        .split('\n')
        .forEach((linha, i) => {
          if (proibidos.test(linha)) infratores.push(`${arquivo}:${i + 1}`);
        });
    }

    expect(
      infratores,
      `usa recurso fora do domAnimation: ${infratores.join(', ')} — suba para domMax`
    ).toEqual([]);
  });

  it('PAC-03: nenhum componente voltou a usar `motion.`', () => {
    /**
     * `strict` já lança erro em runtime, mas em runtime é tarde: quem descobre
     * é o visitante. Aqui a regressão morre no `npm test`.
     *
     * O que arrasta a biblioteca inteira de volta é o COMPONENTE `motion.x`.
     * `MotionConfig`, `AnimatePresence`, `useReducedMotion` e os hooks de
     * MotionValue são núcleo e continuam vindo do mesmo import.
     */
    const infratores: string[] = [];
    for (const arquivo of arquivosTsx()) {
      ler(arquivo)
        .split('\n')
        .forEach((linha, i) => {
          if (/<\/?motion\./.test(linha)) infratores.push(`${arquivo}:${i + 1}`);
        });
    }
    expect(infratores, `voltou a usar motion.: ${infratores.join(', ')}`).toEqual([]);
  });
});

describe('PERF-02 — a divisão em pacotes', () => {
  it('PAC-04: o vite declara a divisão por vida útil', () => {
    const cfg = ler('vite.config.ts');
    expect(cfg).toContain('manualChunks');
    for (const grupo of ["'react'", "'motion'", "'router'"]) {
      expect(cfg, `falta o grupo ${grupo}`).toContain(grupo);
    }
  });

  it('PAC-05: o diálogo de vídeo é carregado sob demanda, e só ele', () => {
    /**
     * A montagem condicional é o que torna o `lazy` seguro no prerender. Se
     * alguém remover o `{selected && ...}` e deixar o componente sempre
     * montado, o `renderToString` suspende e o build cai — mas cairia num erro
     * obscuro de React, longe daqui. Este teste explica antes.
     */
    const secao = ler('src/components/SocialProofSection.tsx');
    expect(secao).toMatch(/const VideoModal = lazy\(\(\) => import\('\.\/VideoModal'\)\)/);
    expect(secao).toMatch(/\{selected && \(/);
    expect(secao).toContain('<Suspense fallback={null}>');

    // E o import estático não pode ter sobrado: ele anularia o lazy em silêncio.
    expect(secao, 'o import estático voltou e o lazy virou enfeite').not.toMatch(
      /^import VideoModal from/m
    );
  });
});

describe.skipIf(!construido)('PERF-02 — medido sobre o que foi publicado', () => {
  const js = readdirSync(assets).filter((f) => f.endsWith('.js'));
  const tamanho = (f: string) => gzipSync(readFileSync(join(assets, f))).length;

  /** O que o HTML manda buscar antes de qualquer interação. */
  const home = ler('dist/index.html');
  const iniciais = js.filter((f) => home.includes(f));
  const inicialGzip = iniciais.reduce((t, f) => t + tamanho(f), 0);

  it('PAC-06: o pacote único acabou', () => {
    expect(js.length, 'voltou a sair um arquivo só').toBeGreaterThan(1);
    // React, motion, router e o app: quatro no caminho crítico.
    expect(iniciais.length).toBeGreaterThanOrEqual(4);
    for (const grupo of ['react', 'motion', 'router']) {
      expect(
        js.some((f) => f.startsWith(grupo + '-')),
        `o pacote ${grupo} não saiu`
      ).toBe(true);
    }
  });

  it('PAC-07: o VideoModal está FORA do caminho crítico', () => {
    const modal = js.find((f) => f.startsWith('VideoModal-'));
    expect(modal, 'o VideoModal voltou para dentro do pacote principal').toBeDefined();
    expect(
      home.includes(modal!),
      'o HTML pré-carrega o VideoModal — ele deixou de ser sob demanda'
    ).toBe(false);
  });

  it('PAC-08: o primeiro carregamento encolheu, e continua encolhido', () => {
    /**
     * A régua é o número medido ANTES da correção: 158,05 KB gzip num arquivo
     * só. O teto abaixo é folgado de propósito — ele não existe para perseguir
     * um recorde, e sim para que um `import` distraído de biblioteca pesada
     * apareça no `npm test` em vez de aparecer no 4G de um visitante.
     */
    const kb = inicialGzip / 1024;
    expect(kb, `caminho crítico em ${kb.toFixed(1)} KB gzip`).toBeLessThan(150);
  });

  it('PAC-09: quem volta depois de uma publicação rebaixa só o app', () => {
    /**
     * O ponto inteiro da divisão. Os pacotes de fornecedor não mudam quando o
     * app muda, então o retorno custa só o `index`. Se um dia o app inchar a
     * ponto de dominar o caminho crítico, a divisão parou de pagar e é melhor
     * saber.
     */
    const app = iniciais.find((f) => f.startsWith('index-'));
    expect(app).toBeDefined();
    const appKb = tamanho(app!) / 1024;
    expect(
      appKb / (inicialGzip / 1024),
      `o app é ${appKb.toFixed(1)} KB de ${(inicialGzip / 1024).toFixed(1)} KB — a divisão parou de pagar`
    ).toBeLessThan(0.5);
  });
});
