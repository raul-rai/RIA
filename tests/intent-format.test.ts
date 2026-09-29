import { describe, it, expect } from 'vitest';
import { formatList, scoreBand, agenticBand } from '../src/lib/intent-format';

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
    expect(scoreBand(90)).toBe('Essa nota é boa — o site sustenta, e o ajuste é fino');
  });
});

describe('agenticBand: a leitura da nota agêntica', () => {
  it('IF-10: fala de agentes, nunca de Google', () => {
    for (const nota of [10, 60, 95]) {
      expect(agenticBand(nota).toLowerCase()).not.toContain('google');
    }
  });

  it('IF-11: as três faixas são distintas', () => {
    expect(new Set([agenticBand(10), agenticBand(60), agenticBand(95)]).size).toBe(3);
  });
});
