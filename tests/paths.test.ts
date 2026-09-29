import { describe, it, expect } from 'vitest';
import { PATHS, pathById } from '../src/content/paths';
import { resolvePath, HEALTHY_SITE_SCORE } from '../src/lib/paths';

describe('PATH: os dois caminhos', () => {
  it('PATH-01: são exatamente dois, com ids estáveis', () => {
    expect(PATHS.map((p) => p.id)).toEqual(['novo', 'otimizar']);
  });

  it('PATH-02: cada um tem rótulo, promessa, etiqueta e sondagem', () => {
    for (const p of PATHS) {
      expect(p.label.length, `${p.id} sem rótulo`).toBeGreaterThan(3);
      expect(p.promise.length, `${p.id} sem promessa`).toBeGreaterThan(20);
      expect(p.tag.length, `${p.id} sem etiqueta`).toBeGreaterThan(2);
      // A sondagem entra no meio de uma frase: minúscula e sem ponto final.
      expect(p.probe[0]).toBe(p.probe[0].toLowerCase());
      expect(p.probe.endsWith('.'), `${p.id}: probe não leva ponto`).toBe(false);
    }
  });

  it('PATH-03: pathById devolve o caminho pedido', () => {
    expect(pathById('novo').id).toBe('novo');
    expect(pathById('otimizar').id).toBe('otimizar');
  });
});

describe('PATH: qual caminho a medição indica', () => {
  it('PATH-04: sem site, o caminho é criar', () => {
    expect(resolvePath({ hasNoWebsite: true, googleScore: null })).toBe('novo');
  });

  it('PATH-05: sem medição, nenhum caminho é sugerido', () => {
    expect(resolvePath({ hasNoWebsite: false, googleScore: null })).toBeNull();
  });

  it('PATH-06: com site medido, o caminho é otimizar — em qualquer faixa', () => {
    expect(resolvePath({ hasNoWebsite: false, googleScore: 20 })).toBe('otimizar');
    expect(resolvePath({ hasNoWebsite: false, googleScore: HEALTHY_SITE_SCORE })).toBe('otimizar');
    expect(resolvePath({ hasNoWebsite: false, googleScore: 98 })).toBe('otimizar');
  });
});
