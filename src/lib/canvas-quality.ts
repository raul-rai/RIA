// Funcoes puras de qualidade do canvas. Sem dependencia de DOM para
// poderem ser testadas isoladamente.

export type QualityTier = 'high' | 'medium' | 'low';

export interface TierSpec {
  cols: number;
  rows: number;
  /** Se falso, pula o preenchimento dos quadrilateros e desenha so o arame. */
  fill: boolean;
}

export const TIERS: Record<QualityTier, TierSpec> = {
  high: { cols: 45, rows: 55, fill: true },
  medium: { cols: 32, rows: 40, fill: true },
  low: { cols: 24, rows: 30, fill: false },
};

/** Telas com DPR 3+ quadruplicam a area de desenho sem ganho visivel. */
export function resolveDpr(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(raw, 2);
}

/** Escolha inicial conservadora: melhor comecar leve e ficar fluido. */
export function pickInitialTier(input: { cores: number; width: number }): QualityTier {
  if (input.width < 768 || input.cores <= 4) return 'low';
  if (input.cores <= 8) return 'medium';
  return 'high';
}

/** Desce um degrau. Nunca promove de volta, para nao oscilar. */
export function downgrade(tier: QualityTier): QualityTier {
  if (tier === 'high') return 'medium';
  if (tier === 'medium') return 'low';
  return 'low';
}

/**
 * Media de FPS por janela de amostras. Devolve null enquanto a janela
 * nao fecha, e a media (reiniciando a janela) quando fecha.
 */
export function createFpsMeter(sampleSize = 60) {
  const samples: number[] = [];
  let last: number | null = null;

  return {
    tick(now: number): number | null {
      if (last === null) {
        last = now;
        return null;
      }
      const dt = now - last;
      last = now;
      if (dt <= 0) return null;

      samples.push(1000 / dt);
      if (samples.length < sampleSize) return null;

      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      samples.length = 0;
      return avg;
    },
  };
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
