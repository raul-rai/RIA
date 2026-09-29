// O laudo do Google - primeiro instrumento da dobra do laudo.
//
// Era codigo solto dentro de PotentialDiagnostic.tsx. Saiu de la por duas
// razoes: a unica maneira de testa-lo aqui e como modulo puro (o ambiente de
// teste e `node`, sem DOM), e porque o componente passou de 900 linhas fazendo
// medicao, parsing e desenho ao mesmo tempo.
//
// A QUINTA DIMENSAO NAO EXISTE MAIS
//
// "Navegacao agentica" eram tres auditorias do Lighthouse (is-crawlable,
// crawlable-anchors, robots-txt) que medem se um crawler CHEGA a pagina - nao
// se um agente consegue USA-LA. Isso agora e medido pelo instrumento certo, no
// laudo ao lado (lib/agentic-report.ts). Manter as duas seria publicar o mesmo
// sinal duas vezes, com a nota fraca puxando a forte.

import { config } from '../config';

export interface WebVital {
  id: string;
  name: string;
  value: string;
  score: number;
}

export interface GoogleDimension {
  id: 'D1' | 'D2' | 'D3' | 'D4';
  nome: string;
  pct: number;
}

export interface GoogleReport {
  score: number;
  dimensions: GoogleDimension[];
  webVitals: WebVital[];
  reading: { nivel: number; nome: string; texto: string };
}

/**
 * Peso de cada dimensao. Somam 1.
 *
 * Eram cinco pesos (0,35 / 0,25 / 0,15 / 0,15 / 0,10). Com a saida da D5, os
 * 0,10 dela foram redistribuidos de forma explicita em vez de rateados com
 * decimal infinito: SEO sobe para 0,20 por ser agora o unico sinal de
 * encontrabilidade dentro DESTE laudo, e Performance para 0,40.
 */
export const PESOS = { D1: 0.4, D2: 0.25, D3: 0.15, D4: 0.2 } as const;

// Nota medida (0..1) em percentual, ou null se nao houve medicao. Exige
// typeof number: Number(null) e 0 e passa em isFinite, o que transformaria
// "nao medido" em "reprovado".
const pct = (score: unknown): number | null =>
  typeof score === 'number' && Number.isFinite(score) ? Math.round(score * 100) : null;

export function pageSpeedUrl(target: string, apiKey: string): string {
  const params = new URLSearchParams({ url: target, strategy: 'mobile' });
  for (const c of ['performance', 'seo', 'accessibility', 'best-practices']) {
    params.append('category', c);
  }
  if (apiKey) params.append('key', apiKey);
  return `${config.pageSpeedApiUrl}?${params.toString()}`;
}

export function parseLighthouse(raw: unknown): GoogleReport | null {
  if (!raw || typeof raw !== 'object') return null;
  const resultado = (raw as Record<string, any>).lighthouseResult;
  const categorias = resultado?.categories;
  if (!categorias || typeof categorias !== 'object') return null;

  const d1 = pct(categorias.performance?.score);
  const d2 = pct(categorias.accessibility?.score);
  const d3 = pct(categorias['best-practices']?.score);
  const d4 = pct(categorias.seo?.score);

  // Sem as quatro notas nao ha laudo. Melhor nenhuma nota que uma nota montada
  // sobre ausencia (a media ponderada exige as quatro; nao ha redistribuicao).
  if (d1 === null || d2 === null || d3 === null || d4 === null) return null;

  const score = Math.round(d1 * PESOS.D1 + d2 * PESOS.D2 + d3 * PESOS.D3 + d4 * PESOS.D4);
  const audits = resultado?.audits ?? {};

  // Vital sem nota numerica e omitido: nao ha fallback inventado (antes,
  // LCP/FCP herdavam a nota de performance e CLS/TBT viravam 100).
  const vital = (auditId: string, id: string, name: string): WebVital[] => {
    const nota = pct(audits[auditId]?.score);
    if (nota === null) return [];
    return [{ id, name, value: audits[auditId]?.displayValue || '—', score: nota }];
  };

  const [nivel, nome, texto] =
    score >= 80
      ? [3, 'Otimizado', 'Velocidade, estrutura semântica e conformidade técnica dentro das diretrizes do Google.']
      : score >= 50
        ? [2, 'Atenção requerida', 'Boa base técnica, com ajustes de carregamento e marcação semântica pendentes.']
        : [1, 'Crítico', 'Gargalos severos de carregamento e estruturação detectados pelo Lighthouse.'];

  return {
    score,
    dimensions: [
      { id: 'D1', nome: 'Desempenho', pct: d1 },
      { id: 'D2', nome: 'Acessibilidade', pct: d2 },
      { id: 'D3', nome: 'Práticas recomendadas', pct: d3 },
      { id: 'D4', nome: 'SEO', pct: d4 },
    ],
    webVitals: [
      ...vital('largest-contentful-paint', 'lcp', 'LCP (Maior Pintura)'),
      ...vital('first-contentful-paint', 'fcp', 'FCP (Primeira Pintura)'),
      ...vital('cumulative-layout-shift', 'cls', 'CLS (Estabilidade Visual)'),
      ...vital('total-blocking-time', 'tbt', 'TBT (Tempo de Bloqueio)'),
    ],
    reading: { nivel, nome: nome as string, texto: texto as string },
  };
}
