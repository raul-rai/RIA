// Funcoes puras da parede de videos 3D. Sem DOM, testadas isoladas — mesmo
// padrao de lib/pointer-tilt.ts e lib/wave-scene.ts. O hook useOrbitWall e o
// CSS consomem estes numeros; aqui nao se toca em elemento nenhum.

export interface PanelPlacement {
  /** Rotacao do painel em torno do eixo Y, em graus. */
  rotateYDeg: number;
  /** Distancia do painel ao centro do rotor, em px (translateZ). */
  radiusPx: number;
}

export interface WallLayoutOpts {
  /** Abertura total do arco, em graus (ex.: 60 = de -30 a +30). */
  arcDeg: number;
  /** Raio do arco, em px. */
  radiusPx: number;
}

/** Limiar abaixo do qual a inercia e considerada parada. */
const INERTIA_STOP = 0.05;

/**
 * Distribui `count` paineis num arco de abertura `arcDeg` centrado em 0.
 * Um painel fica de frente; N paineis se espalham de -arcDeg/2 a +arcDeg/2.
 */
export function layoutPanels(count: number, opts: WallLayoutOpts): PanelPlacement[] {
  if (count <= 0) return [];
  if (count === 1) return [{ rotateYDeg: 0, radiusPx: opts.radiusPx }];
  const step = opts.arcDeg / (count - 1);
  const start = -opts.arcDeg / 2;
  return Array.from({ length: count }, (_, i) => ({
    rotateYDeg: start + i * step,
    radiusPx: opts.radiusPx,
  }));
}

/** Converte deslocamento horizontal do ponteiro (px) em delta de angulo. */
export function dragToAngle(startDeg: number, dxPx: number, sensitivity: number): number {
  return startDeg + dxPx * sensitivity;
}

/** Integra o auto-giro: quantos graus avancar em `dtMs` a `degPerSec`. */
export function stepAutoRotate(angleDeg: number, dtMs: number, degPerSec: number): number {
  return angleDeg + (degPerSec * dtMs) / 1000;
}

/** Decai a velocidade da inercia; zera abaixo do limiar para o loop poder parar. */
export function applyInertia(velDegPerSec: number, damping: number): number {
  const next = velDegPerSec * damping;
  return Math.abs(next) < INERTIA_STOP ? 0 : next;
}

/** Trava a inclinacao vertical para a parede nao virar de cabeca pra baixo. */
export function clampTilt(angleXDeg: number, maxDeg: number): number {
  return Math.min(maxDeg, Math.max(-maxDeg, angleXDeg));
}
