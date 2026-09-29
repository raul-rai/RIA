import type { PathId } from '../content/paths';

/**
 * Corte de saude do site.
 *
 * Mantido do arquivo que este substitui (lib/fronts.ts) porque outros textos
 * ainda o citam como referencia de faixa. Nao decide mais o caminho — decide
 * so o tom com que o agente comenta a nota.
 */
export const HEALTHY_SITE_SCORE = 70;

export interface PathInput {
  hasNoWebsite: boolean;
  googleScore: number | null;
}

/**
 * Qual caminho a medicao indica.
 *
 * `null` significa "o visitante ainda nao mediu" — os dois cartoes aparecem
 * neutros, sem nenhum destacado. Nao confundir com uma recomendacao fraca:
 * destacar um caminho sem medicao seria fingir que a pagina sabe algo que ela
 * nao sabe.
 *
 * Nota alta tambem cai em `otimizar`, de proposito: nota boa nao quer dizer que
 * nao ha o que fazer, quer dizer que o trabalho e outro — e quem decide isso e
 * a conversa, nao esta funcao. O que muda com a faixa e o texto do agente
 * (ver scoreBand em lib/intent-format.ts), nao o caminho.
 */
export function resolvePath(input: PathInput): PathId | null {
  if (input.hasNoWebsite) return 'novo';
  if (input.googleScore === null) return null;
  return 'otimizar';
}
