import { describe, it, expect } from 'vitest';
import { prefersMarkdown } from '../middleware';

/**
 * Negociação de conteúdo Markdown (acceptmarkdown.com).
 *
 * Tranca a decisão pura do middleware.ts: quem pede Markdown recebe Markdown,
 * quem pede HTML (ou é um navegador comum) continua recebendo HTML. O erro que
 * isto previne é servir Markdown a um navegador — ou o contrário — só porque o
 * Accept foi lido de forma preguiçosa.
 */
describe('acceptmarkdown — prefersMarkdown', () => {
  it('MD-01: pedido explícito de text/markdown vence', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true);
    expect(prefersMarkdown('text/x-markdown')).toBe(true);
  });

  it('MD-02: navegador comum (html + */*) recebe HTML', () => {
    expect(
      prefersMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
    ).toBe(false);
  });

  it('MD-03: Accept ausente ou vazio recebe HTML', () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown(undefined)).toBe(false);
    expect(prefersMarkdown('')).toBe(false);
    expect(prefersMarkdown('*/*')).toBe(false);
  });

  it('MD-04: o q-value desempata', () => {
    // markdown preferido sobre html
    expect(prefersMarkdown('text/markdown,text/html;q=0.9')).toBe(true);
    // html preferido sobre markdown
    expect(prefersMarkdown('text/html,text/markdown;q=0.5')).toBe(false);
    // empate resolve a favor de markdown (o agente pediu explicitamente)
    expect(prefersMarkdown('text/html;q=0.9,text/markdown;q=0.9')).toBe(true);
  });

  it('MD-05: markdown recusado com q=0 recebe HTML', () => {
    expect(prefersMarkdown('text/markdown;q=0,text/html')).toBe(false);
  });

  it('MD-06: espaços e caixa não confundem o parser', () => {
    expect(prefersMarkdown('  TEXT/MARKDOWN ; q=1 ')).toBe(true);
  });
});
