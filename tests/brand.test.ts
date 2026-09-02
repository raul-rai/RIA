import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

/**
 * Contrato de marca.
 *
 * A versao anterior deste arquivo exigia o literal `--color-accent: #00E5FF`,
 * valor da decisao D-05 — tomada quando a pagina tinha fundo #010408. A pagina
 * virou branca e #00E5FF sobre branco fica em ~1,5:1 de contraste. O teste
 * passou a afirmar algo que nao podia mais ser verdade sem quebrar leitura.
 *
 * O contrato correto nao e um hex especifico: e **coerencia**. A mesma cor
 * precisa aparecer no CSS, no favicon e no gerador do OG, porque o que quebra a
 * marca e o preview do WhatsApp nao parecer a pagina que abre depois. E ela
 * precisa passar em contraste sobre o fundo branco em que de fato e usada.
 */

const root = (p: string) => resolve(process.cwd(), p);
const css = readFileSync(root('src/index.css'), 'utf-8');
const favicon = readFileSync(root('public/favicon.svg'), 'utf-8');
const ogScript = readFileSync(root('scripts/generate-og.js'), 'utf-8');

/** Extrai o hex de --color-accent do bloco @theme. */
function accentFromCss(): string {
  const match = css.match(/--color-accent:\s*(#[0-9a-fA-F]{6})/);
  if (!match) throw new Error('--color-accent nao encontrado em src/index.css');
  return match[1].toUpperCase();
}

function relativeLuminance(hex: string): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function luminanceOfRgb(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foregroundHex: string, backgroundLuminance: number): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = backgroundLuminance;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * A superfície em que o accent DE FATO cai.
 *
 * Não é branco puro: é o vidro, cujo pigmento é --glass-tint (253 254 255). A
 * diferença parece irrelevante e não é — foi exatamente o que este teste deixou
 * passar. Com #00838F o contraste sobre branco dava 4,52 e o teste aprovava;
 * medido no navegador sobre o vidro, dava 4,49 e reprovava no AA, em sete links
 * de 11px (as fontes das evidências e os "Falar sobre esta frente").
 *
 * Medir contra o fundo errado é o modo mais silencioso de um teste de contraste
 * mentir: ele não fica vermelho, só afrouxa o critério.
 */
function glassTintLuminance(): number {
  const match = css.match(/--glass-tint:\s*(\d+)\s+(\d+)\s+(\d+)/);
  if (!match) throw new Error('--glass-tint nao encontrado em src/index.css');
  return luminanceOfRgb(Number(match[1]), Number(match[2]), Number(match[3]));
}

describe('Brand: uma cor so, coerente em todos os pontos de contato', () => {
  const accent = accentFromCss();

  it('BRAND-01: --color-accent esta definido em @theme', () => {
    expect(accent).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('BRAND-02: o favicon usa a mesma cor do CSS', () => {
    expect(favicon.toUpperCase()).toContain(accent);
  });

  it('BRAND-03: o gerador do OG usa a mesma cor do CSS', () => {
    expect(ogScript.toUpperCase()).toContain(accent);
  });

  it('BRAND-04: a cor de marca e legivel sobre a superficie de vidro, nao so sobre branco', () => {
    // 4.5:1 = minimo WCAG AA para texto normal. O accent e usado em texto
    // pequeno de 11-12px (fontes das evidencias, "Falar sobre esta frente",
    // "Chame o Raul no WhatsApp"), entao e esse o patamar que vale.
    //
    // A medicao e sobre o VIDRO, que e onde esse texto cai. Ver a nota em
    // glassTintLuminance().
    const sobreVidro = contrast(accent, glassTintLuminance());
    expect(sobreVidro, `accent ${accent} sobre o vidro: ${sobreVidro.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it('BRAND-07: as arestas do vidro usam o RGB do accent, nao um teal proprio', () => {
    /**
     * As bordas e brilhos de `.glass-accent` sao o accent escrito como rgba().
     * Quando o hex muda e as rgba nao, a folha passa a carregar dois teais
     * diferentes dizendo a mesma coisa — o mesmo defeito que o laudo do
     * diagnostico ja tinha cometido com dois verdes.
     */
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);
    const esperado = `rgba(${r}, ${g}, ${b},`;

    const blocoAccent = css.match(/\.glass-accent\s*\{([\s\S]*?)\}/)?.[1];
    expect(blocoAccent, 'bloco .glass-accent nao encontrado').toBeTruthy();

    // As tres arestas do tom accent. O --glass-sheen fica de fora de proposito:
    // ele e o ciano da ONDA (0,180,216), uma cor distinta e deliberada, nao o
    // accent escrito de outro jeito.
    const arestas = [...blocoAccent!.matchAll(/--(?:glass-edge|glass-edge-hover|inset-edge):\s*rgba\((\d+),\s*(\d+),\s*(\d+)/g)];
    expect(arestas.length, 'esperava tres arestas em .glass-accent').toBe(3);
    for (const [, ar, ag, ab] of arestas) {
      expect(`${ar},${ag},${ab}`, `aresta de .glass-accent fora do accent ${accent}`).toBe(`${r},${g},${b}`);
    }

    // E o padrao global de quina em hover, que tambem e o accent.
    expect(css.match(/@property --glass-edge-hover[\s\S]*?initial-value:\s*(rgba\([^)]+\))/)?.[1])
      .toContain(esperado);
  });

  it('BRAND-05: public/og-image.png existe', () => {
    expect(existsSync(root('public/og-image.png'))).toBe(true);
  });

  it('BRAND-06: og-image.png cabe no limite de 300KB do WhatsApp', () => {
    expect(statSync(root('public/og-image.png')).size).toBeLessThan(300 * 1024);
  });
});
