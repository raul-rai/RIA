import { describe, it, expect } from 'vitest';
import {
  resolveWaveCamera, smoothstep, surfaceY, projectPoint, quadDepthAlpha,
  underwaterStops, SPACING, SUBMERSION_START, SUBMERSION_FULL,
} from '../src/lib/wave-scene';
import { TIERS, type QualityTier } from '../src/lib/canvas-quality';

/**
 * Rasteriza a cena numa grade de amostragem do viewport e devolve quao densa
 * ela e — malha e agua compostas.
 *
 * Mede DENSIDADE, nao cobertura. A primeira versao deste helper contava
 * qualquer pixel com alpha acima de 0.15 como "pintado", e com isso dava
 * aprovacao a quadros em que a onda cobria a tela inteira com 20% de opacidade
 * sobre branco — visualmente brancos, que e exatamente o defeito em questao.
 *
 * Usa as mesmas funcoes que o componente usa para desenhar. E uma aproximacao
 * do canvas (amostra por ponto, sem antialias), o suficiente para responder a
 * unica pergunta que importa: sobrou tela branca?
 */
function sceneDensity(
  scroll: number,
  tier: QualityTier = 'high',
  { width = 1440, height = 900, gx = 120, gy = 76, time = 0 } = {},
): { media: number; forte: number } {
  const { cols, rows, fill } = TIERS[tier];
  const camera = resolveWaveCamera(scroll);

  const pts = [];
  for (let z = 0; z < rows; z++) {
    for (let x = 0; x < cols; x++) {
      const wx = (x - cols / 2) * SPACING;
      const wz = z * SPACING;
      const wy = surfaceY(wx, wz, camera, time);
      pts.push({ z: wz, ...projectPoint(wx, wy, wz, camera, width, height) });
    }
  }

  // A agua cobre o viewport inteiro de forma uniforme: e o piso da cobertura.
  const stops = underwaterStops(camera.submersion);
  const waterAlpha = stops ? Math.min(...stops.map((s) => Number(s.color.match(/([\d.]+)\)$/)![1]))) : 0;

  const cov = new Float64Array(gx * gy).fill(waterAlpha);

  const inPoly = (qx: number, qy: number, poly: number[][]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > qy) !== (yj > qy) && qx < ((xj - xi) * (qy - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  for (let z = rows - 2; z >= 0; z--) {
    for (let x = 0; x < cols - 1; x++) {
      const i = z * cols + x;
      const p = pts[i], pR = pts[i + 1], pB = pts[i + cols], pBR = pts[i + cols + 1];
      if (p.scale < 0 || p.z < camera.cameraZ) continue;

      const depthAlpha = quadDepthAlpha(p.z, camera, rows);
      if (depthAlpha <= 0) continue;

      const poly = [[p.px, p.py], [pR.px, pR.py], [pBR.px, pBR.py], [pB.px, pB.py]];
      const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
      const mnX = Math.min(...xs), mxX = Math.max(...xs);
      const mnY = Math.min(...ys), mxY = Math.max(...ys);
      if (mxX < 0 || mnX > width || mxY < 0 || mnY > height) continue;

      // Sem fill o quadrilatero contribui so com o arame; a area pintada e
      // desprezivel para efeito de cobertura de fundo.
      const alpha = fill ? Math.min(0.85, depthAlpha) : 0;
      if (alpha <= 0) continue;

      const i0 = Math.max(0, Math.floor((mnX / width) * gx));
      const i1 = Math.min(gx - 1, Math.ceil((mxX / width) * gx));
      const j0 = Math.max(0, Math.floor((mnY / height) * gy));
      const j1 = Math.min(gy - 1, Math.ceil((mxY / height) * gy));
      for (let j = j0; j <= j1; j++) {
        for (let k = i0; k <= i1; k++) {
          const sx = ((k + 0.5) / gx) * width, sy = ((j + 0.5) / gy) * height;
          if (!inPoly(sx, sy, poly)) continue;
          const idx = j * gx + k;
          cov[idx] = cov[idx] + alpha * (1 - cov[idx]);
        }
      }
    }
  }

  let soma = 0, fortes = 0;
  for (const v of cov) {
    soma += v;
    if (v > 0.5) fortes++;
  }
  return { media: soma / cov.length, forte: fortes / cov.length };
}

describe('smoothstep', () => {
  it('ONDA-01: fica preso entre 0 e 1 e e monotonico', () => {
    expect(smoothstep(0.2, 0.8, 0)).toBe(0);
    expect(smoothstep(0.2, 0.8, 1)).toBe(1);
    expect(smoothstep(0.2, 0.8, 0.5)).toBeCloseTo(0.5, 5);
    let prev = -1;
    for (let x = 0; x <= 1.0001; x += 0.05) {
      const v = smoothstep(0.2, 0.8, x);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('resolveWaveCamera', () => {
  it('ONDA-02: a submersao so comeca depois dos capitulos de leitura', () => {
    // Medido no DOM: o ultimo texto escuro sem fundo proprio do capitulo 4 sai
    // pela borda de cima da viewport em 0.846 do progresso.
    for (let s = 0; s <= 0.84; s += 0.04) {
      expect(resolveWaveCamera(s).submersion).toBe(0);
    }
    expect(SUBMERSION_START).toBeGreaterThanOrEqual(0.846);
    // ...e precisa ter fechado antes da ultima dobra, que comeca em ~0.961.
    expect(SUBMERSION_FULL).toBeLessThanOrEqual(0.97);
  });

  it('ONDA-03: a agua fecha por completo antes do fim da pagina', () => {
    expect(resolveWaveCamera(SUBMERSION_FULL).submersion).toBe(1);
    expect(resolveWaveCamera(1).submersion).toBe(1);
    // A ultima dobra comeca em ~0.961 do progresso total.
    expect(resolveWaveCamera(0.961).submersion).toBeGreaterThan(0.7);
  });

  /**
   * Pedido explicito depois da primeira versao: assim que a onda atravessa a
   * tela, o fundo vira so o degrade. Ver a malha boiando atras do agente na
   * ultima dobra estraga o fechamento — a agua ja engoliu o leitor, nao ha mais
   * superficie para mostrar.
   */
  it('ONDA-10: fechada a travessia, nao sobra nenhum pedaco de onda desenhado', () => {
    const { rows } = TIERS.high;
    for (const s of [SUBMERSION_FULL, 0.961, 1]) {
      const camera = resolveWaveCamera(s);
      expect(camera.meshOpacity, `meshOpacity @ ${s}`).toBe(0);
      for (let z = 0; z < rows * SPACING; z += SPACING) {
        expect(quadDepthAlpha(z, camera, rows), `quad z=${z} @ ${s}`).toBe(0);
      }
    }
  });

  it('ONDA-11: a malha so some junto com a agua, nunca antes dela', () => {
    // Se a malha apagasse antes de a agua fechar sobraria branco no meio da
    // travessia — o defeito original com outro nome.
    for (let s = 0; s <= 1.0001; s += 0.02) {
      const { meshOpacity, submersion } = resolveWaveCamera(s);
      expect(meshOpacity + submersion, `soma @ ${s.toFixed(2)}`).toBeCloseTo(1, 6);
    }
  });

  it('ONDA-04: a crista atravessa a camera — a onda engole, nao para na frente', () => {
    const fim = resolveWaveCamera(1);
    expect(fim.tsunamiZ).toBeLessThan(fim.cameraZ);
  });

  it('ONDA-05: submerso, a camera fica abaixo da superficie', () => {
    expect(resolveWaveCamera(0).cameraY).toBeLessThan(0);
    expect(resolveWaveCamera(1).cameraY).toBeGreaterThan(0);
  });

  it('ONDA-06: a janela de desenho atras da crista nunca colapsa', () => {
    // Era 2000 - scroll*1500 = 500 no fim, o que zerava o alpha de toda a
    // malha alem de z=700 e esvaziava a cena.
    for (let s = 0; s <= 1.0001; s += 0.05) {
      expect(resolveWaveCamera(s).fadeOutDist).toBeGreaterThanOrEqual(1200);
    }
  });
});

describe('underwaterStops', () => {
  it('ONDA-07: fora d agua nao pinta nada; submerso pinta opaco', () => {
    expect(underwaterStops(0)).toBeNull();
    const cheio = underwaterStops(1)!;
    expect(cheio).toHaveLength(3);
    for (const s of cheio) {
      expect(Number(s.color.match(/([\d.]+)\)$/)![1])).toBeGreaterThan(0.9);
    }
  });
});

describe('densidade da cena', () => {
  /**
   * A regressao que originou este arquivo: entre 0.88 e 0.89 a cena caia de
   * 100% de cobertura para 7% e ia a zero ate o fim, deixando a dobra de
   * conversao inteira sobre branco. A onda nao sumia por fade — a geometria
   * saia de quadro enquanto a camera continuava fora d agua.
   *
   * O piso e o proprio hero: a dobra 0 e o ponto mais arejado da pagina de
   * proposito, para o titulo respirar. Nenhum outro ponto da rolagem pode
   * ficar mais vazio que ele.
   */
  it('ONDA-08: a cena nunca fica branca nem lavada em nenhum ponto da rolagem', () => {
    const buracos: string[] = [];
    for (let s = 0; s <= 1.0001; s += 0.02) {
      const { media, forte } = sceneDensity(s);
      if (media < 0.3 || forte < 0.38) {
        buracos.push(`${s.toFixed(2)} → media ${media.toFixed(2)}, forte ${(forte * 100).toFixed(0)}%`);
      }
    }
    expect(buracos).toEqual([]);
  });

  // Um pouco mais frouxo que ONDA-08 de proposito: a malha do nivel baixo e
  // 24x30 contra 45x55 do alto, entao ela cobre o mesmo enquadramento com
  // menos quadrilateros e chega a ~0.29 de media no hero. O que este teste
  // protege e o piso — nenhum nivel pode desligar a cor, que foi o defeito do
  // `fill: false` que o nivel baixo carregava.
  it('ONDA-09: vale para todos os niveis de qualidade', () => {
    for (const tier of ['high', 'medium', 'low'] as QualityTier[]) {
      for (const s of [0, 0.5, 0.8, 0.9, 0.95, 1]) {
        expect(sceneDensity(s, tier).media, `${tier} @ ${s}`).toBeGreaterThan(0.28);
      }
    }
  });
});
