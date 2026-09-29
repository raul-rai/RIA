import { describe, it, expect } from 'vitest';
import { computeTilt, shouldArmTilt } from '../src/lib/pointer-tilt';

describe('computeTilt: posição do ponteiro vira rotação', () => {
  const base = { width: 200, height: 100, maxDeg: 8 };

  it('TILT-01: no centro, não inclina', () => {
    expect(computeTilt({ ...base, px: 100, py: 50 })).toEqual({ rotateX: 0, rotateY: 0 });
  });

  it('TILT-02: borda direita gira em Y positivo, sem X', () => {
    expect(computeTilt({ ...base, px: 200, py: 50 })).toEqual({ rotateX: 0, rotateY: 8 });
  });

  it('TILT-03: borda esquerda gira em Y negativo', () => {
    expect(computeTilt({ ...base, px: 0, py: 50 })).toEqual({ rotateX: 0, rotateY: -8 });
  });

  it('TILT-04: ponteiro embaixo inclina o topo para trás (rotateX negativo)', () => {
    expect(computeTilt({ ...base, px: 100, py: 100 })).toEqual({ rotateX: -8, rotateY: 0 });
  });

  it('TILT-05: ponteiro acima → rotateX positivo', () => {
    expect(computeTilt({ ...base, px: 100, py: 0 })).toEqual({ rotateX: 8, rotateY: 0 });
  });

  it('TILT-06: fora dos limites é travado ao máximo, nunca além', () => {
    const t = computeTilt({ ...base, px: 400, py: -50 });
    expect(t.rotateY).toBe(8);
    expect(t.rotateX).toBe(8);
  });

  it('TILT-07: elemento sem área devolve zero — evita divisão por zero', () => {
    expect(computeTilt({ px: 10, py: 10, width: 0, height: 0, maxDeg: 8 })).toEqual({
      rotateX: 0,
      rotateY: 0,
    });
  });
});

describe('shouldArmTilt: quando o tilt liga', () => {
  it('TILT-08: mouse fino e sem reduced-motion → arma', () => {
    expect(shouldArmTilt({ finePointer: true, reducedMotion: false })).toBe(true);
  });

  it('TILT-09: reduced-motion desarma', () => {
    expect(shouldArmTilt({ finePointer: true, reducedMotion: true })).toBe(false);
  });

  it('TILT-10: sem ponteiro fino (toque) desarma', () => {
    expect(shouldArmTilt({ finePointer: false, reducedMotion: false })).toBe(false);
  });
});
