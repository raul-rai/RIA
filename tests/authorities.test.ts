import { describe, it, expect } from 'vitest';
import { AUTHORITIES } from '../src/content/authorities';

describe('AUTHORITIES', () => {
  // O acordeon (mobile) e o grid (desktop) indexam awarenessChecks pela posicao
  // deste array. Se ele crescer, o estado inicial do VulnerabilityContext e o
  // teto de protecao do indice precisam crescer junto.
  it('mantém exatamente três vozes, alinhadas ao awarenessChecks do contexto', () => {
    expect(AUTHORITIES).toHaveLength(3);
  });

  it('entrega tudo que o cartão e o acordeon renderizam', () => {
    for (const authority of AUTHORITIES) {
      expect(authority.name).toBeTruthy();
      expect(authority.title).toBeTruthy();
      expect(authority.quote).toBeTruthy();
      expect(authority.checkboxLabel).toBeTruthy();
      expect(authority.bio).toBeTruthy();
      expect(authority.icon).toBeTruthy();
      expect(authority.thumbnail).toMatch(/^\/autoridades\/.+\.webp$/);
      expect(authority.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/embed\//);
    }
  });

  it('não repete nome nem vídeo entre as vozes', () => {
    expect(new Set(AUTHORITIES.map((a) => a.name)).size).toBe(AUTHORITIES.length);
    expect(new Set(AUTHORITIES.map((a) => a.videoUrl)).size).toBe(AUTHORITIES.length);
  });

  it('mantém o recorte de vídeo coerente quando ele existe', () => {
    for (const { startTime, endTime } of AUTHORITIES) {
      if (endTime === undefined) continue;
      expect(startTime ?? 0).toBeLessThan(endTime);
    }
  });
});
