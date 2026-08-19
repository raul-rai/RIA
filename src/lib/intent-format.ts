import type { Front } from '../content/fronts';

/**
 * Lista legivel dentro de uma frase: "A, B e C".
 *
 * Existe porque join(', ') produz "A, B, C" — que ninguem fala. A mensagem
 * injetada no chat se apresenta como fala do lead; se ela nao soar como fala,
 * a ilusao inteira cai.
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/** As frentes ainda descobertas, na ordem do catalogo. */
export function uncoveredFronts(fronts: Front[], checked: boolean[]): Front[] {
  return fronts.filter((_, i) => !checked[i]);
}

/**
 * Leitura da nota do site em uma linha, sem ponto final.
 *
 * Os cortes (50 e 80) sao os mesmos que PotentialDiagnostic.tsx usa para
 * colorir a nota no resultado. Se um mudar, o outro muda junto — o lead nao
 * pode ver vermelho na tela e ler "sustenta" no chat.
 */
export function scoreBand(score: number): string {
  if (score < 50) return 'Essa nota quer dizer que o site trava antes de convencer alguém';
  if (score < 80) return 'Essa nota quer dizer que o site funciona, mas não compete';
  return 'Essa nota é boa — o site sustenta, e o gargalo está em outra frente';
}
