import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

/**
 * Contrato do ANEL DE FOCO.
 *
 * O defeito (ago/2026): três campos matavam o próprio indicador de foco —
 *
 *     PotentialDiagnostic  focus:outline-none      sem substituto nenhum
 *     QualificationFlow    focus:outline-none      só a borda do .glass-field
 *     AIChatAgent          focus:ring-accent/20    20% de opacidade
 *
 * — e são justamente os campos por onde passam URL, e-mail, telefone e faixa
 * de faturamento. Quem navega por teclado digitava sem saber onde estava.
 *
 * O resto da página dependia do anel PADRÃO do navegador, e quatro componentes
 * tinham anel próprio com receitas diferentes. Não havia sistema: havia
 * exceções. Agora há uma regra `:focus-visible` só, em @layer base.
 */

const root = (p: string) => resolve(process.cwd(), p);
const css = readFileSync(root('src/index.css'), 'utf-8');

function sourceFiles(dir = root('src')): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Luminância relativa de um hex, para as contas de contraste. */
function luminancia(hex: string): number {
  const canal = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * canal(parseInt(hex.slice(1, 3), 16)) +
    0.7152 * canal(parseInt(hex.slice(3, 5), 16)) +
    0.0722 * canal(parseInt(hex.slice(5, 7), 16))
  );
}

const contraste = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const focus = css.match(/--color-focus:\s*(#[0-9a-fA-F]{6})/)?.[1] ?? '';

describe('A11Y-03 — um anel de foco só, e visível nos dois fundos', () => {
  it('FOCO-01: existe uma regra global de :focus-visible', () => {
    const regra = css.match(/:focus-visible\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regra, 'não achei a regra global de :focus-visible').toBeTruthy();
    expect(regra).toContain('var(--color-focus)');
    // 2px é o mínimo de espessura que o critério 2.4.11 (WCAG 2.2 AA) pede.
    expect(regra).toMatch(/outline:\s*2px/);
    expect(regra).toContain('outline-offset');
  });

  it('FOCO-02: o anel é `outline`, não `box-shadow`', () => {
    /**
     * O `ring-*` do Tailwind é box-shadow, e box-shadow é RECORTADO por
     * qualquer ancestral com overflow:hidden — que é o caso do painel do chat,
     * do carrossel e dos cartões de autoridade. O outline moderno acompanha o
     * border-radius sozinho e não disputa a pilha de sombras do vidro, que já
     * carrega o reflexo, a elevação e o anel de seleção.
     */
    const regra = css.match(/:focus-visible\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regra).not.toContain('box-shadow');
  });

  it('FOCO-03: a cor do anel passa em 3:1 sobre o vidro E sobre a água', () => {
    /**
     * Esta página tem dois fundos muito diferentes: o vidro quase branco das
     * primeiras dobras e a água azul-marinho OPACA das últimas (rgb 6,38,66,
     * ver underwaterStops em lib/wave-scene). Uma cor só serve aos dois, e é
     * por isso que o anel NÃO usa o accent — que reprovaria na água (2,64:1),
     * justamente na dobra onde está o formulário.
     */
    expect(focus, '--color-focus não declarado').toMatch(/^#[0-9a-fA-F]{6}$/);

    const vidro = luminancia('#FDFEFF'); // --glass-tint
    const agua = luminancia('#062642'); // fecho de underwaterStops
    const L = luminancia(focus);

    const sobreVidro = contraste(L, vidro);
    const sobreAgua = contraste(L, agua);

    expect(sobreVidro, `anel ${focus} sobre o vidro: ${sobreVidro.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    expect(sobreAgua, `anel ${focus} sobre a água: ${sobreAgua.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });

  it('FOCO-04: ninguém apaga o foco sem repor', () => {
    const infratores: string[] = [];
    for (const file of sourceFiles()) {
      readFileSync(file, 'utf-8')
        .split('\n')
        .forEach((linha, i) => {
          const semComentario = linha.replace(/(^|[^:])\/\/.*$/, '$1');
          if (/focus:outline-none|focus-visible:outline-none/.test(semComentario)) {
            infratores.push(`${file.replace(root('.'), '.')}:${i + 1}`);
          }
        });
    }
    expect(
      infratores,
      `apagam o anel de foco sem repor:\n${infratores.join('\n')}`
    ).toEqual([]);
  });

  it('FOCO-05: nenhum anel avulso disputando com o global', () => {
    /**
     * Quatro componentes tinham a própria receita de anel, cada uma diferente.
     * Um `ring-*` sobrevivente voltaria a desenhar dois indicadores no mesmo
     * elemento — e, pior, com a cor do accent, que é a que reprova na água.
     */
    const infratores: string[] = [];
    for (const file of sourceFiles()) {
      const texto = readFileSync(file, 'utf-8');
      for (const m of texto.matchAll(/focus(?:-visible)?:ring-[\w/[\]-]+/g)) {
        infratores.push(`${file.replace(root('.'), '.')} → ${m[0]}`);
      }
    }
    expect(infratores, `anel avulso:\n${infratores.join('\n')}`).toEqual([]);
  });

  it('FOCO-06: existe a saída para quem não pode desenhar o anel para fora', () => {
    // O botão de play cobre a imagem inteira dentro de um cartão
    // overflow:hidden; o cabeçalho do acordeão encosta em três quinas. Nos dois
    // o anel precisa crescer para dentro, senão a quina o recorta.
    expect(css).toContain('.focus-ring-inset:focus-visible');
    expect(css).toMatch(/\.focus-ring-inset:focus-visible\s*\{[^}]*outline-offset:\s*-/);

    const card = readFileSync(root('src/components/AuthorityCard.tsx'), 'utf-8');
    const acordeao = readFileSync(root('src/components/AuthorityAccordion.tsx'), 'utf-8');
    expect(card).toContain('focus-ring-inset');
    expect(acordeao).toContain('focus-ring-inset');
  });
});
