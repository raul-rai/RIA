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
