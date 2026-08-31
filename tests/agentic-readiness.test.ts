import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  readAgenticReadiness,
  overallScore,
  AGENTIC_AUDITS,
  PESOS,
} from '../src/lib/agentic-readiness';

/**
 * CONF-01 — a quinta dimensão do laudo, agora medida.
 *
 * O defeito (ago/2026): "Navegação agêntica" era
 *
 *     const d5 = d4 >= 80 ? 100 : d4 >= 50 ? 67 : 33;
 *
 * publicada com porcentagem, barra e crachá "3/3" sob o rótulo "Fonte: Google
 * Lighthouse (PageSpeed Insights)". O Lighthouse não mede navegação agêntica.
 * A nota de SEO entrava DUAS vezes na média — 15% como D4 e mais 10%
 * disfarçados de D5 — fingindo ser dois instrumentos.
 *
 * Numa página que vende diagnóstico, o visitante que abrisse o PageSpeed em
 * seguida receberia a prova de que a quinta nota dele foi derivada da quarta.
 */

/** Resposta mínima no formato de `lighthouseResult.audits`. */
const audits = (scores: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, { score }]));

const TODAS_OK = audits({ 'is-crawlable': 1, 'crawlable-anchors': 1, 'robots-txt': 1 });

describe('readAgenticReadiness — só o que o Lighthouse de fato mede', () => {
  it('AGEN-01: as três auditorias existem de verdade na API do Lighthouse', () => {
    // Ids verificados contra a resposta de produção do PageSpeed antes de
    // entrarem aqui. Todas as três voltam com scoreDisplayMode "binary".
    expect(AGENTIC_AUDITS.map((a) => a.id)).toEqual([
      'is-crawlable',
      'crawlable-anchors',
      'robots-txt',
    ]);
    for (const a of AGENTIC_AUDITS) expect(a.label.length).toBeGreaterThan(3);
  });

  it('AGEN-02: três aprovadas devolvem 100% e 3/3', () => {
    const r = readAgenticReadiness(TODAS_OK)!;
    expect(r.pct).toBe(100);
    expect(r.passed).toBe(3);
    expect(r.total).toBe(3);
    expect(r.checks.every((c) => c.ok)).toBe(true);
  });

  it('AGEN-03: a nota acompanha quantas passaram, e diz QUAIS falharam', () => {
    const r = readAgenticReadiness(
      audits({ 'is-crawlable': 1, 'crawlable-anchors': 0, 'robots-txt': 1 })
    )!;
    expect(r.passed).toBe(2);
    expect(r.pct).toBe(67);
    expect(r.checks.find((c) => c.id === 'crawlable-anchors')!.ok).toBe(false);
  });

  it('AGEN-04: nenhuma passou é 0% — e isso é uma MEDIÇÃO, não ausência dela', () => {
    const r = readAgenticReadiness(
      audits({ 'is-crawlable': 0, 'crawlable-anchors': 0, 'robots-txt': 0 })
    )!;
    expect(r.pct).toBe(0);
    expect(r.passed).toBe(0);
  });

  it('AGEN-05: auditoria faltando devolve null — nunca uma nota parcial', () => {
    // O coração da correção. Sem as três, a resposta honesta é "não medido".
    expect(readAgenticReadiness(audits({ 'is-crawlable': 1 }))).toBeNull();
    expect(readAgenticReadiness(audits({ 'is-crawlable': 1, 'robots-txt': 1 }))).toBeNull();
    expect(readAgenticReadiness({})).toBeNull();
    expect(readAgenticReadiness(null)).toBeNull();
    expect(readAgenticReadiness('vish')).toBeNull();
  });

  it('AGEN-06: score null (auditoria manual) conta como não medido, não como zero', () => {
    /**
     * `structured-data` volta da API com scoreDisplayMode "manual" e score
     * null: é lembrete para humano conferir, não medição. Tratar null como 0
     * seria reprovar o site por algo que ninguém mediu — repetindo o defeito
     * original com o sinal trocado.
     */
    expect(
      readAgenticReadiness(
        audits({ 'is-crawlable': 1, 'crawlable-anchors': null, 'robots-txt': 1 })
      )
    ).toBeNull();
  });

  it('AGEN-07: a nota NÃO é derivada da nota de SEO', () => {
    /**
     * A regressão exata. Com a mesma nota de SEO, dois sites de crawlabilidade
     * diferente TÊM que sair com D5 diferente — era o que a função degrau
     * tornava impossível.
     */
    const bom = readAgenticReadiness(TODAS_OK)!;
    const ruim = readAgenticReadiness(
      audits({ 'is-crawlable': 0, 'crawlable-anchors': 1, 'robots-txt': 1 })
    )!;
    expect(bom.pct).not.toBe(ruim.pct);
  });
});

describe('overallScore — ausência de medição não vira nota zero', () => {
  it('AGEN-08: com D5 medida, os cinco pesos somam 1', () => {
    const soma = Object.values(PESOS).reduce((a, b) => a + b, 0);
    expect(soma).toBeCloseTo(1, 10);
    expect(overallScore({ d1: 100, d2: 100, d3: 100, d4: 100, d5: 100 })).toBe(100);
    expect(overallScore({ d1: 0, d2: 0, d3: 0, d4: 0, d5: 0 })).toBe(0);
  });

  it('AGEN-09: sem D5, o peso é redistribuído — não somado como zero', () => {
    /**
     * Um site perfeito nas quatro dimensões medidas precisa tirar 100, não 90.
     * Contar ausência como zero derrubaria a nota em até 10 pontos por causa
     * de algo que o instrumento não conseguiu observar.
     */
    expect(overallScore({ d1: 100, d2: 100, d3: 100, d4: 100, d5: null })).toBe(100);

    const comZero = overallScore({ d1: 80, d2: 80, d3: 80, d4: 80, d5: 0 });
    const semMedir = overallScore({ d1: 80, d2: 80, d3: 80, d4: 80, d5: null });
    expect(semMedir).toBeGreaterThan(comZero);
    expect(semMedir).toBe(80);
  });

  it('AGEN-10: D5 pesa 10% quando medida', () => {
    const com100 = overallScore({ d1: 50, d2: 50, d3: 50, d4: 50, d5: 100 });
    const com0 = overallScore({ d1: 50, d2: 50, d3: 50, d4: 50, d5: 0 });
    expect(com100 - com0).toBe(10);
  });
});

describe('A tela e o laudo contam a mesma história', () => {
  const componente = readFileSync(
    resolve(process.cwd(), 'src/components/PotentialDiagnostic.tsx'),
    'utf-8'
  );
  const codigo = componente
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

  it('AGEN-11: a função degrau não voltou', () => {
    expect(codigo, 'a D5 voltou a ser derivada da nota de SEO').not.toMatch(
      /d4\s*>=\s*80\s*\?\s*100/
    );
    expect(codigo).toContain('readAgenticReadiness');
    expect(codigo).toContain('overallScore');
  });

  it('AGEN-12: a média não é mais somada à mão no componente', () => {
    // Enquanto os pesos viverem em dois lugares, um deles vai divergir.
    expect(codigo, 'a média voltou a ser calculada solta').not.toMatch(/\*\s*0\.35\s*\+/);
  });

  it('AGEN-13: "não medido" tem cor e número próprios, não zero', () => {
    expect(codigo).toContain("labelExtra: 'não medido'");
    expect(codigo).toContain('pct: null');
    // O tom neutro existe e é usado quando não há medição.
    expect(codigo).toContain('NEUTRO');
    expect(codigo).toMatch(/medido \? toneOf/);
  });

  it('AGEN-15: o teto de espera é o mesmo que a tela promete', () => {
    /**
     * A tela diz "pode levar até 30 segundos" e o código abortava em 20 —
     * enquanto uma varredura real, medida contra a API de produção, leva ~21 s
     * na primeira chamada. O app desistia um segundo antes da resposta e
     * anunciava falha para um site que o Lighthouse tinha acabado de medir.
     */
    const teto = Number(componente.match(/PAGESPEED_TIMEOUT_MS\s*=\s*(\d+)/)?.[1]);
    const prometido = Number(componente.match(/Pode levar até (\d+) segundos/)?.[1]);
    expect(teto).toBeGreaterThan(0);
    expect(prometido).toBeGreaterThan(0);
    expect(teto, `teto ${teto}ms contra promessa de ${prometido}s`).toBe(prometido * 1000);
  });

  it('AGEN-14: a tela declara o que as três auditorias NÃO alcançam', () => {
    /**
     * O laudo mede se o motor CONSEGUE CHEGAR. Não responde se o HTML servido
     * já traz o conteúdo antes do JS — o Lighthouse audita a página
     * renderizada. Dizer isso na mesma tela é o que separa este laudo do que
     * ele era.
     */
    expect(componente).toMatch(/não verificam se o conteúdo já está no HTML antes do/);
  });
});
