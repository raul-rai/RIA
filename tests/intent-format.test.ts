import { describe, it, expect } from 'vitest';
import { formatList, uncoveredFronts, scoreBand } from '../src/lib/intent-format';
import { FRONTS } from '../src/content/fronts';

describe('formatList: lista que cabe dentro de uma frase', () => {
  it('FMT-01: lista vazia vira string vazia', () => {
    expect(formatList([])).toBe('');
  });

  it('FMT-02: um item sai sozinho, sem conectivo', () => {
    expect(formatList(['Automação'])).toBe('Automação');
  });

  it('FMT-03: dois itens sao ligados por "e", sem virgula', () => {
    expect(formatList(['Automação', 'Dados'])).toBe('Automação e Dados');
  });

  it('FMT-04: tres ou mais usam virgula ate o ultimo, que entra com "e"', () => {
    expect(formatList(['A', 'B', 'C'])).toBe('A, B e C');
    expect(formatList(['A', 'B', 'C', 'D'])).toBe('A, B, C e D');
  });
});

describe('uncoveredFronts: a pauta da sessao', () => {
  it('FMT-05: sem nada marcado, sobram as cinco na ordem do catalogo', () => {
    const result = uncoveredFronts(FRONTS, [false, false, false, false, false]);
    expect(result.map((f) => f.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('FMT-06: com tudo marcado, nao sobra nenhuma', () => {
    expect(uncoveredFronts(FRONTS, [true, true, true, true, true])).toEqual([]);
  });

  it('FMT-07: devolve exatamente as nao marcadas, preservando a ordem', () => {
    const result = uncoveredFronts(FRONTS, [true, false, true, false, false]);
    expect(result.map((f) => f.id)).toEqual([2, 4, 5]);
  });
});

describe('scoreBand: a leitura da nota do site', () => {
  it('FMT-08: os cortes sao 50 e 80, os mesmos da UI do diagnostico', () => {
    expect(scoreBand(49)).toBe(scoreBand(0));
    expect(scoreBand(50)).toBe(scoreBand(79));
    expect(scoreBand(80)).toBe(scoreBand(100));
    expect(scoreBand(49)).not.toBe(scoreBand(50));
    expect(scoreBand(79)).not.toBe(scoreBand(80));
  });

  it('FMT-09: nenhuma faixa termina com pontuacao — quem fecha a frase e o chamador', () => {
    for (const score of [0, 49, 50, 79, 80, 100]) {
      expect(scoreBand(score).trim()).not.toMatch(/[.?!]$/);
      expect(scoreBand(score).trim().length).toBeGreaterThan(0);
    }
  });

  it('FMT-10: a copy de cada faixa e a aprovada, nao so tres textos distintos', () => {
    expect(scoreBand(30)).toBe('Essa nota quer dizer que o site trava antes de convencer alguém');
    expect(scoreBand(63)).toBe('Essa nota quer dizer que o site funciona, mas não compete');
    expect(scoreBand(90)).toBe('Essa nota é boa — o site sustenta, e o gargalo está em outra frente');
  });
});
