import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AUTHORITIES, AUTHORITIES_DISCLAIMER } from '../src/content/authorities';

/**
 * REESCRITO em ago/2026, junto com a troca de MarketVoicesSection pelo trio
 * SocialProofSection + AuthorityCard + AuthorityAccordion.
 *
 * O que mudou de proposito no produto, e por isso saiu daqui:
 *
 *   - `argument` (descricao) voltou a ser `quote` (fala entre aspas). O teste
 *     antigo proibia aspas; o desenho novo as adota. Decisao de produto.
 *   - a marcacao "estou ciente" voltou aos cartoes. O teste antigo a proibia
 *     porque ela pagava pontos no Indice de Vulnerabilidade. Hoje ela e estado
 *     LOCAL de SocialProofSection e nao toca o indice — AUT-06 abaixo e a
 *     trava que restou, e e a que importa.
 *   - o retrato deixou de vir do YouTube e passou a ser arquivo proprio em
 *     /autoridades. Decisao de produto.
 *
 * O que NAO mudou de proposito, e por isso continua aqui: o disclaimer. Ele ja
 * sumiu da tela duas vezes (commit 4b24851 e a reescrita dos cartoes), sempre
 * em silencio, sempre deixando o cabecalho de authorities.ts afirmando algo
 * falso. AUT-04 e AUT-05 sao a razao de este arquivo existir.
 */

const sourceOf = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), 'src/components', arquivo), 'utf-8');

const section = sourceOf('SocialProofSection.tsx');

describe('AUTHORITIES — as vozes, com as travas que faltavam', () => {
  it('AUT-01: entrega tudo que o cartao renderiza', () => {
    expect(AUTHORITIES.length).toBeGreaterThanOrEqual(3);
    for (const a of AUTHORITIES) {
      expect(a.name.trim()).toBeTruthy();
      expect(a.title.trim()).toBeTruthy();
      expect(a.quote.trim()).toBeTruthy();
      expect(a.bio.trim()).toBeTruthy();
      expect(a.icon).toBeTruthy();
      // -nocookie, nao youtube.com: o player nao pode plantar identificador de
      // publicidade em quem so quis ver um trecho. Ver tests/terceiros.test.ts.
      expect(a.videoUrl).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}/);
      expect(a.thumbnail).toMatch(/^\/autoridades\/[\w.-]+\.webp$/);
    }
  });

  it('AUT-02: nao repete nome nem video', () => {
    expect(new Set(AUTHORITIES.map((a) => a.name)).size).toBe(AUTHORITIES.length);
    expect(new Set(AUTHORITIES.map((a) => a.videoUrl)).size).toBe(AUTHORITIES.length);
  });

  it('AUT-03: o recorte e coerente quando existe', () => {
    for (const { startTime, endTime } of AUTHORITIES) {
      if (endTime === undefined) continue;
      expect(startTime ?? 0).toBeLessThan(endTime);
    }
  });

  /**
   * A REGRESSAO PRINCIPAL, e ela ja aconteceu duas vezes.
   *
   * Sao tres pessoas publicas reais — nome, retrato e fala citada — numa pagina
   * que vende consultoria. Sem a negativa explicita, citar vira insinuar
   * patrocinio. O texto existir em authorities.ts nao basta: no defeito
   * original ele existia no codigo e nao chegava a tela.
   */
  it('AUT-04: o disclaimer nega endosso de forma explicita', () => {
    const texto = AUTHORITIES_DISCLAIMER.toLowerCase();
    expect(texto).toMatch(/endossante|endosso|endossa/);
    expect(texto).toMatch(/nenhuma|não/);
    // Precisa ser uma frase de verdade, nao um rotulo simbolico.
    expect(AUTHORITIES_DISCLAIMER.length).toBeGreaterThan(80);
  });

  it('AUT-05: a secao realmente renderiza o disclaimer', () => {
    expect(section).toContain('AUTHORITIES_DISCLAIMER');
    expect(section).toMatch(/\{AUTHORITIES_DISCLAIMER\}/);
  });

  /**
   * O Indice de Vulnerabilidade mede o que a empresa FAZ, nunca o que ela
   * concorda. A marcacao "estou ciente" pode existir como gesto de leitura,
   * mas no instante em que ela voltar a alimentar o indice, o visitante
   * reduzira a propria vulnerabilidade concordando com o vendedor — que e a
   * mecanica que um comprador experiente reconhece e desconta.
   */
  it('AUT-06: a marcacao das vozes nao toca o Indice de Vulnerabilidade', () => {
    expect(section).not.toContain('useVulnerability');
    for (const arquivo of ['AuthorityCard.tsx', 'AuthorityAccordion.tsx', 'AwarenessCheck.tsx']) {
      expect(sourceOf(arquivo)).not.toContain('useVulnerability');
    }
  });

  it('AUT-07: nenhuma voz e apresentada como cliente ou parceira da RIA', () => {
    for (const a of AUTHORITIES) {
      const texto = (a.title + ' ' + a.bio).toLowerCase();
      expect(texto).not.toMatch(/cliente da ria|parceir[ao] da ria|consultor(ia)? da ria/);
    }
  });
});
