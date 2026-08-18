import type { FrontId } from '../content/fronts';

/**
 * Corte da saude do site.
 *
 * Abaixo disso a presenca digital nao conta como coberta: o site existe, mas
 * nao sustenta ser citado por motor generativo. O numero acompanha a faixa alta
 * do diagnostico da dobra 2.
 */
export const HEALTHY_SITE_SCORE = 70;

export interface FirstFrontInput {
  hasNoWebsite: boolean;
  websiteScore: number | null;
}

/**
 * A frente 1 chega pre-resolvida pelo diagnostico da dobra 2 — e essa e a
 * costura que faltava entre as duas dobras.
 *
 * `null` significa "o visitante nao se diagnosticou": a frente entra neutra,
 * igual as outras quatro. Nao confundir com `false`, que e uma afirmacao — o
 * diagnostico rodou e a presenca digital nao esta coberta.
 */
export function resolveFirstFront(input: FirstFrontInput): boolean | null {
  if (input.hasNoWebsite) return false;
  if (input.websiteScore === null) return null;
  return input.websiteScore >= HEALTHY_SITE_SCORE;
}

export function countChecked(checks: boolean[]): number {
  return checks.filter(Boolean).length;
}

/** Ids das frentes ainda descobertas — a pauta da sessao. */
export function missingFronts(checks: boolean[], ids: FrontId[]): FrontId[] {
  return ids.filter((_, i) => !checks[i]);
}
