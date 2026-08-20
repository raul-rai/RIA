import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Contrato de cascata do vidro.
 *
 * Toda superficie de vidro precisa ser um contexto de posicionamento, porque o
 * ::before que desenha o reflexo especular usa `inset: 0`. Por onde essa
 * declaracao entra na cascata, porem, decide se os utilitarios de posicao do
 * Tailwind ainda funcionam sobre ela.
 *
 * O bug que este teste tranca: `position: relative` morava junto com o resto da
 * fisica do vidro, dentro de `@layer utilities`. Como aquele bloco vem depois do
 * `@import "tailwindcss"`, ele vencia `.absolute` e `.fixed` por ordem de
 * origem. O cartao do indice de vulnerabilidade e a linha do tempo da IA
 * declaravam `absolute top-6 right-6` e `absolute bottom-8 left-8` e viravam
 * blocos `relative` de largura total — o indice esticava por toda a tela, a
 * timeline subia do rodape para o topo, e as duas se sobrepunham.
 *
 * O sintoma nao parecia um erro de CSS: `position: relative` aceita `top` e
 * `right` como deslocamento, entao os cartoes iam para algum lugar plausivel em
 * vez de sumirem. Ninguem olha a cascata quando o elemento aparece na tela.
 *
 * O contrato: a declaracao de posicao das SUPERFICIES vive em
 * `@layer components`, que perde para qualquer utilitario — a precedencia que se
 * espera de uma classe de componente. Os pseudo-elementos continuam livres para
 * declarar `position` onde estiverem: nenhum utilitario mira neles.
 */

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8');

const GLASS_SELECTORS = [
  '.glass',
  '.glass-panel',
  '.glass-card',
  '.glass-chip',
  '.reading-surface',
  '.premium-glass',
  '.glass-inset',
  '.glass-raised',
  '.glass-field',
  '.glass-rail',
];

const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');

/** Casa uma classe de vidro so quando ela termina ali — `.glass` nao pega `.glass-card`. */
const bareGlass = new RegExp(
  '(' + GLASS_SELECTORS.map((s) => s.replace('.', String.raw`\.`)).join('|') + ')(?![\\w-])',
);

/** Corpos de todos os blocos `@layer <nome>`, por contagem de chaves. */
function layerBodies(name: string): string[] {
  const bodies: string[] = [];
  const opener = new RegExp(String.raw`@layer\s+${name}\s*\{`, 'g');
  let match: RegExpExecArray | null;

  while ((match = opener.exec(css)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }
    bodies.push(css.slice(start, i - 1));
  }
  return bodies;
}

/** Regras `seletor { corpo }`, descendo para dentro de at-rules aninhadas. */
function rules(body: string): { selector: string; block: string }[] {
  const out: { selector: string; block: string }[] = [];
  let prelude = '';
  let i = 0;

  while (i < body.length) {
    if (body[i] !== '{') {
      prelude += body[i];
      i++;
      continue;
    }
    let depth = 1;
    let j = i + 1;
    while (j < body.length && depth > 0) {
      if (body[j] === '{') depth++;
      else if (body[j] === '}') depth--;
      j++;
    }
    const block = body.slice(i + 1, j - 1);
    const selector = prelude.trim();
    // At-rule (@media, @supports…) nao e um seletor: o que interessa esta dentro.
    if (selector.startsWith('@')) out.push(...rules(block));
    else out.push({ selector, block });
    prelude = '';
    i = j;
  }
  return out;
}

/** Declaracoes do proprio bloco, sem as dos blocos aninhados dentro dele. */
function ownDeclarations(block: string): string {
  let out = '';
  let depth = 0;
  for (const ch of block) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth === 0) out += ch;
  }
  return out;
}

describe('cascata do vidro (GLASS-LAYER)', () => {
  it('GLASS-LAYER-01: nenhuma superficie de vidro declara position dentro de @layer utilities', () => {
    const suspeitas = layerBodies('utilities')
      .flatMap((body) => rules(semComentarios(body)))
      .filter((r) => bareGlass.test(r.selector) && !r.selector.includes('::'))
      .filter((r) => /position\s*:/.test(ownDeclarations(r.block)))
      .map((r) => r.selector.replace(/\s+/g, ' '));

    expect(suspeitas).toEqual([]);
  });

  it('GLASS-LAYER-02: @layer components declara position: relative para as superficies de vidro', () => {
    const componentes = layerBodies('components');
    expect(componentes.length).toBeGreaterThan(0);

    const posicionadas = componentes
      .flatMap((body) => rules(semComentarios(body)))
      .filter((r) => /position\s*:\s*relative/.test(ownDeclarations(r.block)))
      .map((r) => r.selector);

    expect(posicionadas.length).toBeGreaterThan(0);

    const cobertura = posicionadas.join(',');
    for (const seletor of GLASS_SELECTORS) {
      const escapado = seletor.replace('.', String.raw`\.`);
      expect(cobertura).toMatch(new RegExp(escapado + String.raw`(?![\w-])`));
    }
  });

  it('GLASS-LAYER-03: o tailwind e importado antes de qualquer layer proprio', () => {
    const importa = css.indexOf('@import "tailwindcss"');
    const primeiroLayer = css.search(/@layer\s+\w+\s*\{/);
    expect(importa).toBeGreaterThanOrEqual(0);
    expect(importa).toBeLessThan(primeiroLayer);
  });
});
