import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  parseAgenticReport, classifyProblem, issuesByTier,
} from '../src/lib/agentic-report';
import { parseSseFrames } from '../src/lib/sse';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/is-agentic-report.json'), 'utf-8')
);

describe('AGT: laudo do Is Agentic', () => {
  it('AGT-01: lê nota, rótulo, data e link de conferência', () => {
    const report = parseAgenticReport(fixture)!;
    expect(report.score).toBe(72);
    expect(report.scoreLabel).toBe('Ready with a few material gaps');
    expect(report.scannedAt).toBe('2026-09-07T15:35:19.037Z');
    expect(report.reportUrl).toBe('https://is-agentic.com/scan/raulvieira.vercel.app');
  });

  it('AGT-02: separa os apontamentos por nível', () => {
    const report = parseAgenticReport(fixture)!;
    expect(issuesByTier(report, 'essential').map((i) => i.id)).toEqual([
      'agent-friendly-404',
      'markdown-negotiation-vary',
    ]);
    expect(issuesByTier(report, 'recommended').map((i) => i.id)).toEqual(['trust-anchors']);
  });

  it('AGT-03: preserva o `details`, que é a evidência do laudo', () => {
    const report = parseAgenticReport(fixture)!;
    const vary = report.issues.find((i) => i.id === 'markdown-negotiation-vary')!;
    expect(vary.details).toContain('Vary header missing Accept');
    expect(vary.result).toBe('failed');
  });

  it('AGT-04: resposta sem nota numérica vira null — nunca zero', () => {
    expect(parseAgenticReport({ ...fixture, score: null })).toBeNull();
    expect(parseAgenticReport({ ...fixture, score: 'alto' })).toBeNull();
    expect(parseAgenticReport(null)).toBeNull();
    expect(parseAgenticReport('oi')).toBeNull();
  });

  it('AGT-05: apontamento malformado é descartado, o laudo sobrevive', () => {
    const sujo = { ...fixture, issues: [...fixture.issues, { id: 42 }, null] };
    const report = parseAgenticReport(sujo)!;
    expect(report.issues).toHaveLength(3);
  });

  it('AGT-06: classifica as falhas documentadas da API', () => {
    expect(classifyProblem(429, 'rate_limit_exceeded')).toBe('rate-limited');
    expect(classifyProblem(400, 'invalid_url')).toBe('invalid-url');
    expect(classifyProblem(503, 'report_temporarily_unavailable')).toBe('unreachable');
    expect(classifyProblem(500, undefined)).toBe('unreachable');
  });

  it('AGT-07: campo ausente do bucket vira null, nunca zero', () => {
    const semPassing = JSON.parse(JSON.stringify(fixture));
    delete semPassing.score_breakdown.essential.passing;
    semPassing.score_breakdown.essential.total = null;
    semPassing.score_breakdown.essential.available = 'oito';
    const report = parseAgenticReport(semPassing)!;
    expect(report.essential.passing).toBeNull();
    expect(report.essential.total).toBeNull();
    expect(report.essential.available).toBeNull();
    expect(report.essential.earned).toBe(59);
  });

  it('AGT-08: zero medido de verdade continua zero, não vira null', () => {
    const zerado = JSON.parse(JSON.stringify(fixture));
    zerado.score_breakdown.essential.passing = 0;
    const report = parseAgenticReport(zerado)!;
    expect(report.essential.passing).toBe(0);
  });

  it('AGT-09: apontamento com `details` ou `recommendation` de tipo errado é descartado', () => {
    const sujo = JSON.parse(JSON.stringify(fixture));
    sujo.issues[0].details = 12345;
    const report = parseAgenticReport(sujo)!;
    expect(report.issues.find((i) => i.id === 'agent-friendly-404')).toBeUndefined();
    expect(report.issues).toHaveLength(2);
  });
});

describe('SSE: quadros', () => {
  it('SSE-01: separa quadros completos e devolve o resto', () => {
    const { frames, rest } = parseSseFrames('data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c"');
    expect(frames).toEqual(['data: {"a":1}', 'data: {"b":2}']);
    expect(rest).toBe('data: {"c"');
  });

  it('SSE-02: normaliza CRLF', () => {
    const { frames } = parseSseFrames('data: 1\r\n\r\n');
    expect(frames).toEqual(['data: 1']);
  });

  it('SSE-03: buffer sem quadro fechado não emite nada', () => {
    const { frames, rest } = parseSseFrames('data: parcial');
    expect(frames).toEqual([]);
    expect(rest).toBe('data: parcial');
  });
});
