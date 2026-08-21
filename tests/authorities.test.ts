import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  AUTHORITIES,
  AUTHORITIES_DISCLAIMER,
  embedUrl,
  thumbnailUrl,
} from '../src/content/authorities';

const sectionSource = readFileSync(
  resolve(process.cwd(), 'src/components/MarketVoicesSection.tsx'),
  'utf-8'
);

describe('AUTHORITIES — as vozes, com as travas que faltavam', () => {
  it('AUT-01: entrega tudo que o cartão renderiza', () => {
    expect(AUTHORITIES.length).toBeGreaterThanOrEqual(3);
    for (const a of AUTHORITIES) {
      expect(a.name.trim()).toBeTruthy();
      expect(a.title.trim()).toBeTruthy();
      expect(a.argument.trim()).toBeTruthy();
      expect(a.bio.trim()).toBeTruthy();
      expect(a.icon).toBeTruthy();
      expect(a.videoId).toMatch(/^[\w-]{11}$/);
    }
  });

  it('AUT-02: não repete nome nem vídeo', () => {
    expect(new Set(AUTHORITIES.map((a) => a.name)).size).toBe(AUTHORITIES.length);
    expect(new Set(AUTHORITIES.map((a) => a.videoId)).size).toBe(AUTHORITIES.length);
  });

  it('AUT-03: o recorte é coerente quando existe', () => {
    for (const { startTime, endTime } of AUTHORITIES) {
      if (endTime === undefined) continue;
      expect(startTime ?? 0).toBeLessThan(endTime);
    }
  });

  /**
   * A REGRESSÃO PRINCIPAL.
   *
   * O disclaimer existia, era descrito como regra no topo de authorities.ts, e
   * foi removido da tela no commit 4b24851 — classificado como `chore`. Nada
   * quebrou, porque nada o testava, e o arquivo de conteúdo seguiu afirmando
   * por meses que "o rodapé da seção diz isso em voz alta" enquanto não dizia.
   *
   * Estes dois testes são o que faltava.
   */
  it('AUT-04: o disclaimer nega endosso de forma explícita', () => {
    const texto = AUTHORITIES_DISCLAIMER.toLowerCase();
    expect(texto).toMatch(/endossante|endosso|endossa/);
    expect(texto).toMatch(/nenhuma|não/);
    // Precisa ser uma frase de verdade, não um rótulo simbólico.
    expect(AUTHORITIES_DISCLAIMER.length).toBeGreaterThan(80);
  });

  it('AUT-05: a seção realmente renderiza o disclaimer', () => {
    // Testar só a constante não bastaria: no defeito original o texto existia
    // no código e não chegava à tela.
    expect(sectionSource).toContain('AUTHORITIES_DISCLAIMER');
    expect(sectionSource).toMatch(/\{AUTHORITIES_DISCLAIMER\}/);
  });

  /**
   * O índice mede o que a empresa FAZ, nunca o que ela concorda. Esta seção
   * hospedava os checkboxes que pagavam 5 pontos por concordância — se alguém
   * tentar recolocá-los aqui, isto quebra antes de chegar à produção.
   */
  it('AUT-06: nenhuma voz carrega mecânica de pontuação por concordância', () => {
    for (const a of AUTHORITIES) {
      expect(a).not.toHaveProperty('checkboxLabel');
    }
    expect(sectionSource).not.toContain('useVulnerability');
    expect(sectionSource).not.toContain('AwarenessCheck');
  });

  it('AUT-07: nenhuma citação entre aspas — argumento é descrição, não transcrição', () => {
    for (const a of AUTHORITIES) {
      expect(a).not.toHaveProperty('quote');
      // Aspas em `argument` sinalizariam transcrição não verificável voltando
      // pela porta dos fundos.
      expect(a.argument).not.toMatch(/["“”]/);
    }
  });

  it('AUT-08: nenhum retrato auto-hospedado — a imagem vem do próprio YouTube', () => {
    for (const a of AUTHORITIES) {
      expect(thumbnailUrl(a)).toBe(`https://img.youtube.com/vi/${a.videoId}/hqdefault.jpg`);
      expect(a).not.toHaveProperty('thumbnail');
    }
    expect(sectionSource).not.toContain('/autoridades/');
  });

  it('AUT-09: o embed aplica o recorte curado', () => {
    const comRecorte = AUTHORITIES.find((a) => a.startTime !== undefined && a.endTime !== undefined);
    expect(comRecorte).toBeDefined();
    const url = embedUrl(comRecorte!);
    expect(url).toContain(`/embed/${comRecorte!.videoId}`);
    expect(url).toContain(`start=${comRecorte!.startTime}`);
    expect(url).toContain(`end=${comRecorte!.endTime}`);
  });
});
