import { describe, it, expect } from 'vitest';
import { FRONTS } from '../src/content/fronts';
import { resolveFirstFront, countChecked } from '../src/lib/fronts';
import { CASES } from '../src/content/cases';

describe('FRONTS: o catalogo real da RIA', () => {
  it('FRONT-01: sao exatamente tres frentes, com ids de 1 a 3', () => {
    expect(FRONTS).toHaveLength(3);
    expect(FRONTS.map((f) => f.id)).toEqual([1, 2, 3]);
  });

  it('FRONT-02: a primeira frente e a presenca digital, que amarra com a dobra 2', () => {
    expect(FRONTS[0].label).toContain('Presença digital');
  });

  it('FRONT-03: nenhuma frente tem label ou promessa vazia', () => {
    for (const f of FRONTS) {
      expect(f.label.trim().length).toBeGreaterThan(0);
      expect(f.promise.trim().length).toBeGreaterThan(0);
      expect(f.tag.trim().length).toBeGreaterThan(0);
    }
  });

  it('FRONT-10: toda frente tem sondagem, formatada para entrar no meio de uma frase', () => {
    for (const f of FRONTS) {
      const probe = f.probe.trim();
      expect(probe.length).toBeGreaterThan(0);
      // Entra depois de "o que sua empresa faz, e ...?" — maiuscula ou ponto
      // final quebrariam a frase do agente.
      expect(probe).not.toMatch(/[.?!]$/);
      expect(probe[0]).toBe(probe[0].toLowerCase());
    }
  });
});

describe('resolveFirstFront: a dobra 2 pre-resolve a frente 1', () => {
  it('FRONT-04: quem declarou nao ter site chega com a frente 1 vazia', () => {
    expect(resolveFirstFront({ hasNoWebsite: true, websiteScore: null })).toBe(false);
  });

  it('FRONT-05: nota abaixo de 70 chega com a frente 1 vazia', () => {
    expect(resolveFirstFront({ hasNoWebsite: false, websiteScore: 69 })).toBe(false);
  });

  it('FRONT-06: nota de 70 para cima chega com a frente 1 marcada', () => {
    expect(resolveFirstFront({ hasNoWebsite: false, websiteScore: 70 })).toBe(true);
    expect(resolveFirstFront({ hasNoWebsite: false, websiteScore: 95 })).toBe(true);
  });

  it('FRONT-07: quem nao fez o diagnostico chega neutro, como as outras quatro', () => {
    expect(resolveFirstFront({ hasNoWebsite: false, websiteScore: null })).toBeNull();
  });
});

describe('countChecked', () => {
  it('FRONT-08: conta apenas as marcadas', () => {
    expect(countChecked([true, false, true, false, false])).toBe(2);
    expect(countChecked([false, false, false, false, false])).toBe(0);
  });
});

describe('CASES: cada caso prova uma frente', () => {
  it('FRONT-09: todo caso aponta para uma frente existente', () => {
    const ids = FRONTS.map((f) => f.id);
    // `front` e opcional desde ago/2026: casos do tipo 'entrega' podem nao
    // mapear em nenhuma frente vendida hoje, e forcar um mapa falso so para
    // preencher a etiqueta e o mesmo pecado de fabricar numero. O contrato e:
    // quem declara frente, declara uma que existe.
    for (const c of CASES) {
      if (c.front === undefined) continue;
      expect(ids).toContain(c.front);
    }
    // E ao menos um caso precisa provar alguma frente, senao a secao inteira
    // deixa de sustentar o que o titulo dela promete.
    expect(CASES.some((c) => c.front !== undefined)).toBe(true);
  });
});
