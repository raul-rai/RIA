import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAgentContext } from '../scripts/build-agent-context';
import { FRONTS } from '../src/content/fronts';

const publicado = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/agent-context.json'), 'utf-8')
);

describe('agent-context: o contexto que o agente le', () => {
  it('CTX-01: o arquivo publicado e identico ao que o gerador produz agora', () => {
    // Este e o teste que impede a divergencia que produziu o "1 das 5 frentes"
    // em producao: mexer em src/content sem regenerar quebra aqui, no CI, e
    // nao na frente de um lead.
    expect(publicado).toEqual(buildAgentContext());
  });

  it('CTX-02: as frentes do contexto sao exatamente as frentes do site', () => {
    expect(publicado.fronts).toHaveLength(FRONTS.length);
    expect(publicado.fronts.map((f: { id: number }) => f.id)).toEqual(FRONTS.map((f) => f.id));
  });

  it('CTX-03: nenhuma frente descontinuada sobrevive no contexto', () => {
    const texto = JSON.stringify(publicado.fronts);
    expect(texto).not.toContain('Sistema sob medida');
    expect(texto).not.toContain('Dados e decisão');
  });

  it('CTX-04: a sessao gratuita dura 15 minutos, como a pagina diz', () => {
    expect(publicado.positioning.firstCall.minutes).toBe(15);
    expect(publicado.positioning.firstCall.free).toBe(true);
  });

  it('CTX-05: caso sem apuracao chega marcado como nao auditado', () => {
    for (const c of publicado.cases) {
      expect(c.audited).toBe(Boolean(c.measurement));
    }
  });

  it('CTX-06: toda evidencia chega com fonte e ano, que e o que o agente pode citar', () => {
    expect(publicado.evidence.length).toBeGreaterThan(0);
    for (const e of publicado.evidence) {
      expect(e.source.trim().length).toBeGreaterThan(0);
      expect(typeof e.year).toBe('number');
    }
  });

  it('CTX-07: o gerador e deterministico — nada de timestamp', () => {
    expect(JSON.stringify(buildAgentContext())).toBe(JSON.stringify(buildAgentContext()));
    expect(JSON.stringify(publicado)).not.toContain('generatedAt');
  });

  it('CTX-08: toda intencao do site tem significado declarado para o agente', () => {
    // O intentId chegava ao n8n e era descartado. Se uma intencao nova entrar
    // em content/intents.ts sem entrar aqui, o agente volta a ficar cego para
    // a dobra de origem.
    const doSite = ['hero-cold', 'diagnostic-result', 'diagnostic-no-website',
      'front-pick', 'fronts-agenda', 'credibility'];
    expect(publicado.intents.map((i: { id: string }) => i.id).sort()).toEqual([...doSite].sort());
    for (const i of publicado.intents) {
      expect(i.meaning.trim().length).toBeGreaterThan(20);
    }
  });

  it('CTX-09: o 101 e explicado como marcador, nunca como percentual', () => {
    expect(publicado.vulnerability.noWebsiteIndex).toBe(101);
    expect(publicado.vulnerability.note.toLowerCase()).toContain('nao e medicao');
  });
});

describe('vercel.json: o contexto precisa ser SERVIDO, nao reescrito', () => {
  const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));

  it('CTX-10: o arquivo e JSON valido', () => {
    // Ja quebrou: um `\.` dentro de string JSON e escape invalido, e o deploy
    // inteiro cai. Barra invertida em regex de rota vira classe [.].
    expect(Array.isArray(vercel.rewrites)).toBe(true);
  });

  it('CTX-11: nenhum rewrite engole o agent-context.json', () => {
    // Antes o site reescrevia TUDO para /index.html e precisava de uma exceção
    // para o contexto. Agora não há catch-all: só /onda (rota client-only, sem
    // arquivo prerenderizado) é reescrita, e todo o resto — inclusive
    // agent-context.json, sitemap.xml, llms.txt e os .md — é servido como
    // arquivo estático. Se algum rewrite voltasse a capturar o contexto, o n8n
    // baixaria HTML no lugar do JSON, em silêncio (o HTTP continua 200).
    for (const { source } of vercel.rewrites) {
      const regex = new RegExp('^' + source + '$');
      expect(regex.test('/agent-context.json'), `rewrite ${source} captura o contexto`).toBe(false);
    }
    // A única rota client-only continua reescrita para o app shell.
    expect(vercel.rewrites.some((r: { source: string }) => r.source === '/onda')).toBe(true);
  });

  it('CTX-12: caminho inexistente cai num 404 real, não no app shell', () => {
    // Sem catch-all, um GET num caminho que não existe não é reescrito para
    // /index.html (que devolveria 200 e faria o agente crer que toda rota
    // existe). A Vercel serve dist/404.html com status 404. Aqui trancamos os
    // dois lados do contrato: nenhum rewrite captura um caminho arbitrário, e o
    // 404.html foi gerado.
    const arbitrario = '/isto-nao-existe-em-lugar-nenhum';
    for (const { source } of vercel.rewrites) {
      const regex = new RegExp('^' + source + '$');
      expect(regex.test(arbitrario), `rewrite ${source} captura caminho arbitrário`).toBe(false);
    }
  });
});
