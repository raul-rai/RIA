// Funcoes puras do tilt de ponteiro. Sem DOM, para serem testadas isoladas —
// mesmo padrao de lib/canvas-quality.ts e lib/wave-scene.ts.

export interface TiltInput {
  /** Posicao do ponteiro relativa ao canto superior esquerdo do elemento, em px. */
  px: number;
  py: number;
  /** Dimensoes do elemento, em px. */
  width: number;
  height: number;
  /** Inclinacao maxima, em graus, atingida nas bordas. */
  maxDeg: number;
}

export interface Tilt {
  rotateX: number;
  rotateY: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Converte a posicao do ponteiro dentro do elemento num par de rotacoes.
 * Centro = repouso (0,0). Direita gira em Y positivo; ponteiro embaixo inclina
 * o topo para tras (X negativo), que e o sentido natural de "olhar de cima".
 */
export function computeTilt(input: TiltInput): Tilt {
  const { px, py, width, height, maxDeg } = input;
  if (width <= 0 || height <= 0) return { rotateX: 0, rotateY: 0 };
  const nx = clamp((px / width) * 2 - 1, -1, 1);
  const ny = clamp((py / height) * 2 - 1, -1, 1);
  const rotateX = -ny * maxDeg;
  const rotateY = nx * maxDeg;
  return { rotateX: rotateX === 0 ? 0 : rotateX, rotateY: rotateY === 0 ? 0 : rotateY };
}

/** So arma com mouse de verdade e sem pedido de movimento reduzido. */
export function shouldArmTilt(input: { finePointer: boolean; reducedMotion: boolean }): boolean {
  return input.finePointer && !input.reducedMotion;
}
