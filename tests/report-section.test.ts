import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = (p: string) => resolve(process.cwd(), p);
const ler = (p: string) => readFileSync(root(p), 'utf-8');
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const secao = ler('src/components/ReportSection.tsx');
const google = ler('src/components/GoogleReportCard.tsx');
const agentic = ler('src/components/AgenticReportCard.tsx');

describe('LAUDO: duas notas, dois instrumentos', () => {
  it('LAU-01: a seção monta as duas colunas', () => {
    expect(secao).toContain('<GoogleReportCard');
    expect(secao).toContain('<AgenticReportCard');
  });

  it('LAU-02: cada coluna nomeia a sua fonte', () => {
    expect(google).toMatch(/Google Lighthouse/);
    expect(agentic).toMatch(/Is Agentic/);
    expect(agentic).toMatch(/Vercel Labs/);
  });

  it('LAU-03: a coluna agêntica publica o link de conferência', () => {
    expect(agentic).toContain('reportUrl');
  });

  it('LAU-04: a coluna agêntica separa essencial de recomendado', () => {
    expect(agentic).toContain('issuesByTier');
    expect(agentic).toMatch(/'essential'/);
    expect(agentic).toMatch(/'recommended'/);
  });

  it('LAU-05: a coluna agêntica mostra a evidência, não só o nome do problema', () => {
    expect(agentic).toMatch(/\.details/);
  });

  it('LAU-06: nenhuma das três combina as duas notas', () => {
    const tudo = semComentarios(secao + google + agentic);
    expect(tudo).not.toMatch(/média|media geral|notaGeral|combinedScore/i);
  });

  it('LAU-07: ausência de medição imprime texto, nunca zero', () => {
    for (const [nome, fonte] of [['google', google], ['agentic', agentic]] as const) {
      const corpo = semComentarios(fonte);
      expect(corpo, `${nome}: score literal zero`).not.toMatch(/score\s*[=:]\s*0\b/);
      expect(corpo).toMatch(/não medido/);
    }
  });

  it('LAU-08: a quinta dimensão não sobreviveu', () => {
    expect(google).not.toMatch(/Navegação agêntica|D5/);
  });
});
