import { describe, it, expect } from 'vitest';
import {
  layoutPanels, dragToAngle, stepAutoRotate, applyInertia, clampTilt,
} from '../src/lib/orbit-wall';

describe('layoutPanels: distribui os painéis num arco centrado', () => {
  it('WALL-01: três painéis num arco de 60° ficam em -30, 0, +30', () => {
    const p = layoutPanels(3, { arcDeg: 60, radiusPx: 520 });
    expect(p.map((x) => x.rotateYDeg)).toEqual([-30, 0, 30]);
    expect(p.every((x) => x.radiusPx === 520)).toBe(true);
  });

  it('WALL-02: um único painel fica de frente (0°)', () => {
    expect(layoutPanels(1, { arcDeg: 60, radiusPx: 400 })).toEqual([
      { rotateYDeg: 0, radiusPx: 400 },
    ]);
  });

  it('WALL-03: zero painéis devolve lista vazia', () => {
    expect(layoutPanels(0, { arcDeg: 60, radiusPx: 400 })).toEqual([]);
  });
});

describe('dragToAngle: deslocamento horizontal vira ângulo', () => {
  it('WALL-04: soma linear e simétrica', () => {
    expect(dragToAngle(10, 100, 0.3)).toBeCloseTo(40);
    expect(dragToAngle(10, -100, 0.3)).toBeCloseTo(-20);
  });
});

describe('stepAutoRotate: integra o giro no tempo', () => {
  it('WALL-05: 6°/s por 1000ms avança 6°', () => {
    expect(stepAutoRotate(0, 1000, 6)).toBeCloseTo(6);
  });
});

describe('applyInertia: decai e zera no limiar', () => {
  it('WALL-06: decai multiplicando pelo amortecimento', () => {
    expect(applyInertia(10, 0.9)).toBeCloseTo(9);
  });
  it('WALL-07: abaixo do limiar vira exatamente 0', () => {
    expect(applyInertia(0.04, 0.9)).toBe(0);
  });
});

describe('clampTilt: trava a inclinação vertical', () => {
  it('WALL-08: nunca passa do máximo em módulo', () => {
    expect(clampTilt(20, 12)).toBe(12);
    expect(clampTilt(-20, 12)).toBe(-12);
    expect(clampTilt(5, 12)).toBe(5);
  });
});
