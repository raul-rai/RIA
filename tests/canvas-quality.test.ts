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

import { pickInitialTier, downgrade, createFpsMeter } from '../src/lib/canvas-quality';

describe('pickInitialTier', () => {
  it('QUAL-06: telas estreitas comecam no nivel baixo', () => {
    expect(pickInitialTier({ cores: 16, width: 420 })).toBe('low');
  });

  it('QUAL-07: poucos nucleos comecam no nivel baixo', () => {
    expect(pickInitialTier({ cores: 2, width: 1920 })).toBe('low');
  });

  it('QUAL-08: maquina intermediaria comeca no medio', () => {
    expect(pickInitialTier({ cores: 8, width: 1440 })).toBe('medium');
  });

  it('QUAL-09: desktop potente comeca no alto', () => {
    expect(pickInitialTier({ cores: 16, width: 1920 })).toBe('high');
  });
});

describe('downgrade', () => {
  it('QUAL-10: desce um degrau por vez e para no baixo', () => {
    expect(downgrade('high')).toBe('medium');
    expect(downgrade('medium')).toBe('low');
    expect(downgrade('low')).toBe('low');
  });
});

describe('createFpsMeter', () => {
  it('QUAL-11: so devolve media ao completar a janela de amostras', () => {
    const meter = createFpsMeter(3);
    expect(meter.tick(0)).toBeNull();
    expect(meter.tick(16)).toBeNull();
    expect(meter.tick(32)).toBeNull();
    const avg = meter.tick(48);
    expect(avg).not.toBeNull();
    expect(avg!).toBeGreaterThan(55);
    expect(avg!).toBeLessThan(70);
  });

  it('QUAL-12: reinicia a janela apos entregar uma media', () => {
    const meter = createFpsMeter(2);
    meter.tick(0);
    meter.tick(16);
    expect(meter.tick(32)).not.toBeNull();
    expect(meter.tick(48)).toBeNull();
  });
});
