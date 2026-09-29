import { describe, it, expect } from 'vitest';
import { parseLighthouse, pageSpeedUrl, PESOS } from '../src/lib/lighthouse-report';

const bruto = {
  lighthouseResult: {
    categories: {
      performance: { score: 0.5 },
      accessibility: { score: 0.9 },
      'best-practices': { score: 1 },
      seo: { score: 0.8 },
    },
    audits: {
      'largest-contentful-paint': { displayValue: '2,8 s', score: 0.4 },
      'first-contentful-paint': { displayValue: '1,2 s', score: 0.9 },
      'cumulative-layout-shift': { displayValue: '0,02', score: 1 },
      'total-blocking-time': { displayValue: '210 ms', score: 0.6 },
    },
  },
};

describe('LH: laudo do Lighthouse', () => {
  it('LH-01: os pesos somam 1', () => {
    expect(PESOS.D1 + PESOS.D2 + PESOS.D3 + PESOS.D4).toBeCloseTo(1, 10);
  });

  it('LH-02: quatro dimensões, nenhuma quinta', () => {
    const r = parseLighthouse(bruto)!;
    expect(r.dimensions.map((d) => d.id)).toEqual(['D1', 'D2', 'D3', 'D4']);
    expect(r.dimensions.map((d) => d.pct)).toEqual([50, 90, 100, 80]);
  });

  it('LH-03: a nota geral é a média ponderada das quatro', () => {
    const r = parseLighthouse(bruto)!;
    expect(r.score).toBe(Math.round(50 * 0.4 + 90 * 0.25 + 100 * 0.15 + 80 * 0.2));
  });

  it('LH-04: publica os quatro Core Web Vitals com o valor legível', () => {
    const r = parseLighthouse(bruto)!;
    expect(r.webVitals.map((v) => v.id)).toEqual(['lcp', 'fcp', 'cls', 'tbt']);
    expect(r.webVitals[0].value).toBe('2,8 s');
    expect(r.webVitals[3].score).toBe(60);
  });

  it('LH-05: resposta sem categorias vira null — nunca laudo zerado', () => {
    expect(parseLighthouse({ lighthouseResult: { categories: {} } })).toBeNull();
    expect(parseLighthouse({})).toBeNull();
    expect(parseLighthouse(null)).toBeNull();
  });

  it('LH-06: a leitura acompanha a faixa da nota', () => {
    expect(parseLighthouse(bruto)!.reading.nivel).toBe(2);
    const alto = { lighthouseResult: { ...bruto.lighthouseResult, categories: {
      performance: { score: 1 }, accessibility: { score: 1 },
      'best-practices': { score: 1 }, seo: { score: 1 },
    } } };
    expect(parseLighthouse(alto)!.reading.nivel).toBe(3);
  });

  it('LH-07: monta a URL do PageSpeed com as quatro categorias', () => {
    const url = pageSpeedUrl('https://exemplo.com/', 'CHAVE');
    expect(url).toContain('category=performance');
    expect(url).toContain('category=accessibility');
    expect(url).toContain('category=best-practices');
    expect(url).toContain('category=seo');
    expect(url).toContain('strategy=mobile');
    expect(url).toContain('key=CHAVE');
  });

  it('LH-08: sem chave, a URL não leva parâmetro key vazio', () => {
    expect(pageSpeedUrl('https://exemplo.com/', '')).not.toContain('key=');
  });

  // Acrescentados alem do brief: o codigo do brief transformava ausencia em zero.
  it('LH-09: categoria sem nota numérica vira laudo null — ausência não é zero', () => {
    const sem = (cat: string, valor: unknown) => ({
      lighthouseResult: {
        ...bruto.lighthouseResult,
        categories: { ...bruto.lighthouseResult.categories, [cat]: { score: valor } },
      },
    });
    for (const cat of ['performance', 'accessibility', 'best-practices', 'seo']) {
      expect(parseLighthouse(sem(cat, null))).toBeNull();
      expect(parseLighthouse(sem(cat, undefined))).toBeNull();
      expect(parseLighthouse(sem(cat, 'x'))).toBeNull();
    }
    // Zero medido de verdade continua sendo zero.
    expect(parseLighthouse(sem('seo', 0))!.dimensions[3].pct).toBe(0);
  });

  it('LH-10: Web Vital sem nota é omitido — nada de nota inventada', () => {
    const parcial = {
      lighthouseResult: {
        ...bruto.lighthouseResult,
        audits: {
          'largest-contentful-paint': { displayValue: '2,8 s', score: 0.4 },
          'first-contentful-paint': { displayValue: '1,2 s', score: null },
          'cumulative-layout-shift': { displayValue: '0,02' },
        },
      },
    };
    const r = parseLighthouse(parcial)!;
    expect(r.webVitals.map((v) => v.id)).toEqual(['lcp']);
    // Nota zero medida (nao ausente) e publicada.
    const zero = { lighthouseResult: { ...bruto.lighthouseResult, audits: {
      'total-blocking-time': { displayValue: '4 s', score: 0 },
    } } };
    expect(parseLighthouse(zero)!.webVitals).toEqual([
      { id: 'tbt', name: 'TBT (Tempo de Bloqueio)', value: '4 s', score: 0 },
    ]);
  });
});
