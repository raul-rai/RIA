// A cena da onda, em funcoes puras.
//
// Toda esta matematica vivia dentro do useEffect de DataWave3D, onde nada podia
// ser verificado: a onda e a narrativa central da pagina e mesmo assim o unico
// jeito de saber se ela aparecia era abrir o navegador e rolar. Foi assim que
// passou despercebido que a cena ficava geometricamente vazia nos ultimos 12%
// da rolagem — justamente sobre a dobra de conversao.
//
// O componente continua dono do canvas; aqui fica so o que decide ONDE as
// coisas estao. Ver tests/wave-scene.test.ts para o contrato.

/** Distancia entre pontos da malha, em unidades de mundo. */
export const SPACING = 150;

/** Distancia focal da projecao em perspectiva. */
export const FOCAL_LENGTH = 800;

/**
 * ────────────────────────────────────────────────────────────────────────────
 * POSICOES DE CONTEUDO MEDIDAS  (nao sao preferencias — sao fatos do layout)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Estes dois valores descrevem ONDE o conteudo esta na rolagem. Eles mudam
 * sempre que um capitulo entra, sai ou muda de altura, e a unica forma honesta
 * de obte-los e MEDINDO no build, nunca estimando.
 *
 * Medicao atual (ago/2026, layout de 7 dobras, viewport de desktop):
 *
 *   LAST_DARK_TEXT_EXIT  O ultimo texto escuro SEM FUNDO PROPRIO da pagina e o
 *                        h3 "Como o numero e apurado", no capitulo 5. Ele sai
 *                        pelo topo da viewport aqui. Escurecer o canvas antes
 *                        disso apagaria a leitura.
 *
 *   CTA_CHAPTER_START    Onde comeca a ultima dobra (o agente e a agenda). A
 *                        agua precisa ter fechado ANTES, para o agente receber
 *                        o degrade limpo, sem onda aparecendo por tras.
 *
 * Como remedir depois de mexer nos capitulos: sirva o build e rode no console
 * a busca pelo ultimo elemento de texto que NAO esteja dentro de .glass-* nem
 * de .reading-surface, dividindo seu `bottom` absoluto por
 * (scrollHeight - innerHeight).
 */
export const LAST_DARK_TEXT_EXIT = 0.8278;
export const CTA_CHAPTER_START = 0.9353;

/**
 * Rolagem em que a agua comeca a fechar sobre a camera, e em que ela termina
 * de fechar.
 *
 * Derivados das medicoes acima, com as MESMAS margens que a calibracao original
 * de 6 dobras usava (+0.004 na entrada, -0.031 na saida). Manter as margens em
 * vez dos numeros absolutos e o que preserva a sensacao da cena quando o
 * conteudo se move: a rampa continua com ~0.07 de largura, como antes.
 *
 * tests/wave-scene.test.ts falha se a relacao com as medicoes se romper — que
 * e o aviso que nao existia quando estes numeros eram literais soltos.
 */
export const SUBMERSION_START = LAST_DARK_TEXT_EXIT + 0.004;
export const SUBMERSION_FULL = CTA_CHAPTER_START - 0.031;

export interface WaveCamera {
  /** Posicao da camera no eixo de profundidade. */
  cameraZ: number;
  /** Altura da camera. Positivo = abaixo da superficie da agua. */
  cameraY: number;
  /** Profundidade da crista. Menor que cameraZ = a crista ja passou por nos. */
  tsunamiZ: number;
  /** Altura maxima da onda. */
  maxAmplitude: number;
  /** Quanto da malha atras da crista continua desenhada. */
  fadeOutDist: number;
  /** 0 = fora d'agua, 1 = submerso. */
  submersion: number;
  /**
   * Opacidade global da malha. Chega a zero quando a agua fecha: depois que a
   * onda atravessa a tela o fundo e so o degrade, sem a superficie aparecendo
   * por tras do conteudo.
   */
  meshOpacity: number;
}

/** Interpolacao suave entre duas bordas, com derivada zero nas pontas. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x < edge0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Converte o progresso de rolagem (0 → 1) na posicao da cena.
 *
 * A onda vem de longe, cresce, quebra sobre a camera e afunda o leitor. Os tres
 * momentos precisam terminar juntos em scroll = 1: se a crista passa antes da
 * agua fechar, sobra tela branca; se a agua fecha antes da crista chegar, a
 * onda some sem quebrar.
 */
export function resolveWaveCamera(scroll: number): WaveCamera {
  const submersion = smoothstep(SUBMERSION_START, SUBMERSION_FULL, scroll);

  return {
    cameraZ: -400 + scroll * 200,
    // O termo de submersao empurra a camera para baixo da superficie. Sem ele a
    // camera fica boiando acima de uma agua que ja deveria ter fechado.
    cameraY: -320 + scroll * 120 + submersion * 760,
    tsunamiZ: 3600 - scroll * 4100,
    maxAmplitude: 750 + scroll * 1250,
    // Antes: 2000 - scroll * 1500, o que deixava 500 no fim e zerava o alpha de
    // toda fileira alem de z=700 — a malha inteira sumia de uma vez.
    fadeOutDist: 2000 - scroll * 600,
    submersion,
    // A malha se dissolve na mesma janela em que a agua fecha: a onda atravessa
    // a tela e entrega o fundo ao degrade, em vez de ficar boiando atras do
    // conteudo da ultima dobra.
    meshOpacity: 1 - submersion,
  };
}

/** Altura da superficie num ponto da malha, ja com onda, ruido e espuma. */
export function surfaceY(x: number, z: number, camera: WaveCamera, time: number): number {
  const noiseX = Math.sin(x * 0.005 + time * 1.5);
  const noiseZ = Math.cos(z * 0.005 - time * 1.2);
  let y = (noiseX + noiseZ) * 25;

  // A crista e curva: as bordas chegam depois do centro.
  const curvature = x * x * 0.0002;
  const distToTsunami = z - (camera.tsunamiZ + curvature);

  if (distToTsunami > -600 && distToTsunami < 1500) {
    const waveHeight =
      distToTsunami > 0
        ? Math.cos((distToTsunami / 1500) * (Math.PI / 2))
        : Math.sqrt(Math.cos((distToTsunami / -600) * (Math.PI / 2)));

    const edgeRatio = Math.abs(x) / 3800;
    const edgeTaper = Math.pow(Math.max(0, 1 - edgeRatio), 1.6);

    y -= waveHeight * camera.maxAmplitude * edgeTaper;

    if (waveHeight > 0.6) {
      const crestNoise =
        (Math.sin(x * 0.01 + time * 4) + Math.cos(z * 0.01 - time * 3)) *
        (50 + camera.submersion * 50);
      y -= crestNoise * (waveHeight - 0.6) * 4;
    }
  }

  return y;
}

export interface Projected {
  px: number;
  py: number;
  scale: number;
}

/** Projecao em perspectiva de um ponto de mundo para pixels do canvas. */
export function projectPoint(
  x: number, y: number, z: number,
  camera: WaveCamera, width: number, height: number,
): Projected {
  const scale = FOCAL_LENGTH / (z - camera.cameraZ);
  return {
    scale,
    px: x * scale + width / 2,
    py: (y - camera.cameraY) * scale + height * 0.54,
  };
}

/**
 * Opacidade de um quadrilatero pela sua profundidade. Zero significa que ele
 * nao deve ser desenhado.
 */
export function quadDepthAlpha(z: number, camera: WaveCamera, rows: number): number {
  let depthAlpha = Math.max(0, 1.2 - (z - camera.cameraZ) / (rows * SPACING * 0.8));

  const distBehindPeak = z - camera.tsunamiZ;
  if (distBehindPeak > 0) {
    const fade = Math.max(0, 1 - distBehindPeak / camera.fadeOutDist);
    /**
     * O corte por distancia atras da crista existe para esconder a agua que
     * ainda nao chegou ao leitor. Ele so faz sentido enquanto a crista esta
     * longe: conforme ela encosta na camera, a malha INTEIRA passa a contar
     * como "atras do pico" e o corte apaga a cena — era isto que lavava a tela
     * ate o quase branco entre 0.76 e 0.88 da rolagem, antes mesmo de a onda
     * quebrar.
     *
     * Com a crista em cima de nos nao existe atras: o corte se dissolve na
     * mesma medida em que ela chega, e some de vez quando estamos submersos.
     */
    const crestArrived = smoothstep(1200, -200, camera.tsunamiZ);
    const dissolve = Math.max(crestArrived, camera.submersion);
    depthAlpha *= fade + (1 - fade) * dissolve;
  }

  return depthAlpha * camera.meshOpacity;
}

/**
 * Paradas do gradiente da agua vista por dentro: claro perto da superficie,
 * escuro no fundo. Devolve null enquanto a camera esta fora d'agua.
 *
 * Este gradiente e o que garante que a ultima dobra nunca volte a ser branca —
 * ele nao depende de a malha estar enquadrada.
 */
export function underwaterStops(
  submersion: number,
): { offset: number; color: string }[] | null {
  if (submersion <= 0) return null;
  // Alpha uniforme nas tres paradas: submerso, o degrade precisa ser opaco de
  // ponta a ponta. Com o topo em 0.94 sobrava 6% do branco da pagina atravessando
  // a faixa de cima, e era justamente ali que a onda antiga aparecia lavada.
  const a = Math.min(1, submersion).toFixed(3);
  return [
    { offset: 0, color: `rgba(14, 116, 144, ${a})` },
    { offset: 0.45, color: `rgba(11, 78, 118, ${a})` },
    { offset: 1, color: `rgba(6, 38, 66, ${a})` },
  ];
}
