import { describe, it, expect } from 'vitest';
import { resolveDpr, TIERS } from '../src/lib/canvas-quality';

describe('resolveDpr', () => {
  it('QUAL-01: limita o DPR em 2 para nao explodir a area de desenho', () => {
    expect(resolveDpr(3)).toBe(2);
    expect(resolveDpr(4)).toBe(2);
  });

  it('QUAL-02: preserva DPR entre 1 e 2', () => {
    expect(resolveDpr(1)).toBe(1);
    expect(resolveDpr(1.5)).toBe(1.5);
  });

  it('QUAL-03: cai para 1 diante de valor invalido', () => {
    expect(resolveDpr(0)).toBe(1);
    expect(resolveDpr(NaN)).toBe(1);
  });
});

describe('TIERS', () => {
  it('QUAL-04: o nivel alto preserva a malha atual de 45x55', () => {
    expect(TIERS.high).toEqual({ cols: 45, rows: 55, fill: true });
  });

  it('QUAL-05: os niveis decrescem em custo', () => {
    expect(TIERS.medium.cols).toBeLessThan(TIERS.high.cols);
    expect(TIERS.low.cols).toBeLessThan(TIERS.medium.cols);
    expect(TIERS.low.fill).toBe(false);
  });
});
