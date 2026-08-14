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

function contrastOnWhite(hex: string): number {
  return 1.05 / (relativeLuminance(hex) + 0.05);
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

  it('BRAND-04: a cor de marca e legivel sobre o fundo branco da pagina', () => {
    // 4.5:1 = minimo WCAG AA para texto normal. O accent e usado em texto
    // pequeno (selos, labels), entao precisa passar nesse patamar.
    expect(contrastOnWhite(accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('BRAND-05: public/og-image.png existe', () => {
    expect(existsSync(root('public/og-image.png'))).toBe(true);
  });

  it('BRAND-06: og-image.png cabe no limite de 300KB do WhatsApp', () => {
    expect(statSync(root('public/og-image.png')).size).toBeLessThan(300 * 1024);
  });
});
